const { GObject, St, Clutter } = imports.gi
const Main = imports.ui.main
const Calendar = imports.ui.calendar
const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

var Notifications = GObject.registerClass(
    class Notifications extends St.BoxLayout{
        _init(options){
            let useNativeControls = options.useNativeControls
            let hideWhenNoNotifications = options.hideWhenNoNotifications

            super._init({
                vertical: true,
            })

            let datemenu = new imports.ui.dateMenu.DateMenuButton()
            let messageList = datemenu._messageList
            this.notificationList = messageList._notificationSection
            this.nativeDndSwitch = messageList._dndButton
            this.nativeClearButton = messageList._clearButton

            // media controls
            this.mediaSection = messageList._mediaSection
            this.mediaSection.get_parent().remove_child(this.mediaSection)

            // notification list scroll
            this.list = messageList._scrollView
            this.list.get_parent().remove_child(this.list)

            // header / title
            let headerBox = new St.BoxLayout({ style_class: "QSTWEAKS-notifications-header" })
            this.add_child(headerBox)
            this.add_child(this.list)
            let titleLabel = new St.Label({
                text: ExtensionUtils.gettext('Notifications'),
                style_class: "QSTWEAKS-notifications-title",
                y_align: Clutter.ActorAlign.CENTER,
                x_align: Clutter.ActorAlign.START,
                x_expand: true
            })
            headerBox.add_child(titleLabel)

            // no notifications text
            let noNotiBox = new St.BoxLayout({x_align: Clutter.ActorAlign.CENTER})
            noNotiBox.style_class = "QSTWEAKS-notifications-no-notifications-box"
            const noNotiPlaceholder = new NoNotifPlaceholder()
            noNotiBox.add_child(noNotiPlaceholder)
            noNotiBox.hide()
            this.add_child(noNotiBox)

            // clear button / dnd switch
            if (useNativeControls) {
                // if use native controls
                {
                    let parent = this.nativeClearButton.get_parent()
                    parent.remove_child(this.nativeClearButton)
                    parent.remove_child(this.nativeDndSwitch)
                    this.nativeDndText = parent.first_child
                    parent.remove_child(this.nativeDndText)
                }

                let nativeControlBox = new St.BoxLayout()
                nativeControlBox.add_child(this.nativeDndText)
                nativeControlBox.add_child(this.nativeDndSwitch)
                nativeControlBox.add_child(this.nativeClearButton)
                this.nativeControlBox = nativeControlBox
                this.add_child(nativeControlBox)
            } else {
                this.clearButton = new ClearNotificationsButton()
                this.clearButton.connect("clicked",()=>{
                    messageList._sectionList.get_children().forEach(s => s.clear())
                })
                headerBox.add_child(this.clearButton)
            }

            // sync notifications
            let stockNotifications = Main.panel.statusArea.dateMenu._messageList._notificationSection
            let notifications = stockNotifications._messages
            notifications.forEach(n => {
                let notification = new Calendar.NotificationMessage(n.notification)
                this.notificationList.addMessage(notification)
            })

            // sync no-notification placeholder and clear button
            const updateNoNotifications = ()=>{
                if (this.nativeClearButton.reactive) {
                    this.list.show()
                    noNotiBox.hide()
                    if (this.clearButton) this.clearButton.show()
                    if (hideWhenNoNotifications) this.show()
                } else {
                    this.list.hide()
                    noNotiBox.show()
                    if (this.clearButton) this.clearButton.hide()
                    if (hideWhenNoNotifications) this.hide()
                }
            }
            this.nativeClearButton.connect('notify::reactive', updateNoNotifications)
            updateNoNotifications()

            this.connect('destroy', () => {
                datemenu.destroy()
                datemenu = null
            })
        }
    }
)

const NoNotifPlaceholder = GObject.registerClass(
class NoNotifPlaceholder extends St.BoxLayout {
    _init() {
        super._init({
            style_class: 'QSTWEAKS-notifications-no-notifications-placeholder',
            vertical: true,
            opacity: 60
        })

        this._icon = new St.Icon({
            style_class: 'QSTWEAKS-notifications-no-notifications-placeholder-icon',
            icon_name: 'no-notifications-symbolic'
        })
        this.add_child(this._icon)

        this._label = new St.Label({ text: _('No Notifications') })
        this.add_child(this._label)
    }
})

const ClearNotificationsButton = GObject.registerClass(
class ClearNotificationsButton extends St.Button {
    _init() {
        let container = new St.BoxLayout({
            x_expand: true,
            y_expand: true,
        })

        super._init({
            style_class: 'QSTWEAKS-notifications-clear-button',
            button_mask: St.ButtonMask.ONE,
            child: container,
            reactive: true,
            can_focus: true,
            y_align: Clutter.ActorAlign.CENTER,
        })

        this._icon = new St.Icon({
            style_class: 'QSTWEAKS-notifications-clear-button-icon',
            icon_name: 'user-trash-symbolic',
            icon_size: 12
        })
        container.add_child(this._icon)

        this._label = new St.Label({
            text: _('Clear')
        })
        container.add_child(this._label)
    }
})
