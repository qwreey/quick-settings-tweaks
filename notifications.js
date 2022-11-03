const { GObject, St, Clutter } = imports.gi;
const Main = imports.ui.main
const Calendar = imports.ui.calendar;

var Notifications = GObject.registerClass(
    class Notifications extends St.BoxLayout{
        _init(options={}){
            super._init({
                vertical: true,
                style_class: 
                    (options.integrated ? "" : "popup-menu-content quick-settings ")
                    + (options.integrated ? "qwreey-notifications-integrated " : "")
                    + 'qwreey-notifications'
                    + (options.dndSwitch ? " qwreey-notifications-with-dnd" : "")
            })

            let datemenu = new imports.ui.dateMenu.DateMenuButton()
            let messageList = datemenu._messageList
            this.notificationList = messageList._notificationSection

            // notification buttons
            this.dndSwitch = messageList._dndButton
            this.clearButton = messageList._clearButton
            {
                let parent = this.clearButton.get_parent()
                parent.remove_child(this.clearButton)
                parent.remove_child(this.dndSwitch)
                this.dndText = parent.first_child
                parent.remove_child(this.dndText)
            }

            // media controls
            this.mediaSection = messageList._mediaSection
            this.mediaSection.get_parent().remove_child(this.mediaSection)
            this.mediaSection.style_class += " qwreey-media"

            // notification list scroll
            this.list = messageList._scrollView
            this.list.get_parent().remove_child(this.list)

            // header
            let headerBox = new St.BoxLayout()
            let titleLabel = new St.Label({ text: _('Notifications'), y_align: Clutter.ActorAlign.CENTER })
            titleLabel.style_class = "qwreey-notifications-title"
            headerBox.add_child(titleLabel)
            this.add_child(headerBox)
            this.add_child(this.list)

            // no notifications text
            let noNotiBox = new St.BoxLayout({x_align: Clutter.ActorAlign.CENTER})
            noNotiBox.style_class = "qwreey-notifications-no-notifications-box"
            const noNotiPlaceholder = new NoNotifPlaceholder();
            noNotiBox.add_child(noNotiPlaceholder)
            noNotiBox.hide()
            this.add_child(noNotiBox)

            // dnd button
            if (options.dndSwitch) {
                let dndBox = new St.BoxLayout()
                dndBox.style_class = "qwreey-notifications-dnd-box"
                dndBox.add_child(this.dndText)
                dndBox.add_child(this.dndSwitch)
                dndBox.add_child(this.clearButton)
                this.add_child(dndBox)
            } else {
                headerBox.add_child(this.clearButton)
            }

            // sync notifications
            let stockNotifications = Main.panel.statusArea.dateMenu._messageList._notificationSection
            let notifications = stockNotifications._messages
            notifications.forEach(n => {
                let notification = new Calendar.NotificationMessage(n.notification)
                this.notificationList.addMessage(notification)
            })

            // show no notifications label
            const updateNoNotifications = ()=>{
                if (this.clearButton.reactive) {
                    this.list.show()
                    noNotiBox.hide()
                } else {
                    this.list.hide()
                    noNotiBox.show()
                }
            }
            this.clearButton.connect('notify::reactive', updateNoNotifications)
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
            style_class: 'qwreey-notifications-no-notifications-placeholder',
            vertical: true,
            opacity: 60
        });

        this._icon = new St.Icon({
            icon_name: 'no-notifications-symbolic'
        });
        this.add_child(this._icon);

        this._label = new St.Label({
            text: _('No Notifications')
        });
        this.add_child(this._label);
    }
});