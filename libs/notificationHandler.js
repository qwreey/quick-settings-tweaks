const { GObject, St, Clutter } = imports.gi;
const Main = imports.ui.main
const Calendar = imports.ui.calendar;

var Notifications = GObject.registerClass(
    class Notifications extends St.BoxLayout{
        _init(){
            super._init({
                vertical: true,
            })

            let datemenu = new imports.ui.dateMenu.DateMenuButton()
            let messageList = datemenu._messageList
            this.notificationList = messageList._notificationSection

            // media controls
            this.mediaSection = messageList._mediaSection
            this.mediaSection.get_parent().remove_child(this.mediaSection)

            // notification list scroll
            this.list = messageList._scrollView
            this.list.get_parent().remove_child(this.list)

            // header
            let headerBox = new St.BoxLayout()
            let titleLabel = new St.Label({
                text: _('Notifications'),
                style_class: "QSTWEAKS-notifications-title",
                y_align: Clutter.ActorAlign.CENTER,
                x_align: Clutter.ActorAlign.START,
                x_expand: true
            })
            headerBox.add_child(titleLabel)
            this.clearButton = new ClearNotificationsButton();
            headerBox.add_child(this.clearButton);
            this.add_child(headerBox)
            this.add_child(this.list)

            // Add "System Default Style DND Switch Option" in Settings
            // dnd button
            // if (options.dndSwitch) {
            //     let dndBox = new St.BoxLayout()
            //     dndBox.style_class = "qwreey-notifications-dnd-box"
            //     dndBox.add_child(this.dndText)
            //     dndBox.add_child(this.dndSwitch)
            //     dndBox.add_child(this.clearButton)
            //     this.add_child(dndBox)
            // } else {
            //     headerBox.add_child(this.clearButton)
            // }

            // no notifications text
            let noNotiBox = new St.BoxLayout({x_align: Clutter.ActorAlign.CENTER})
            noNotiBox.style_class = "QSTWEAKS-notifications-no-notifications-box"
            const noNotiPlaceholder = new NoNotifPlaceholder();
            noNotiBox.add_child(noNotiPlaceholder)
            noNotiBox.hide()
            this.add_child(noNotiBox)

            // sync notifications
            let stockNotifications = Main.panel.statusArea.dateMenu._messageList._notificationSection
            let notifications = stockNotifications._messages
            notifications.forEach(n => {
                let notification = new Calendar.NotificationMessage(n.notification)
                this.notificationList.addMessage(notification)
            })

            // sync no-notification placeholder and clear button
            const placeholder = Main.panel.statusArea.dateMenu._messageList._placeholder;
            const updateNoNotifications = () => {
                if (placeholder.visible) {
                    this.list.hide()
                    noNotiBox.show()
                    this.clearButton.hide()
                } else {
                    this.list.show()
                    noNotiBox.hide()
                    this.clearButton.show()
                }
            };
            placeholder.connect('notify::visible', updateNoNotifications)
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

        this._icon = new St.Icon({ icon_name: 'no-notifications-symbolic' });
        this.add_child(this._icon);

        this._label = new St.Label({ text: _('No Notifications') });
        this.add_child(this._label);
    }
});

const ClearNotificationsButton = GObject.registerClass(
class ClearNotificationsButton extends St.Button {
    _init() {
        super._init({
            style_class: 'QSTWEAKS-notifications-clear-button',
            reactive: true,
            track_hover: true,
            can_focus: true,
            y_align: Clutter.ActorAlign.CENTER,
        });

        this._icon = new St.Icon({
            icon_name: 'user-trash-symbolic',
            icon_size: 12
        });
        this.add_child(this._icon);

        this._label = new St.Label({ text: _('Clear') });
        this.add_child(this._label);

        this.connect('clicked', () => {
            // Misuse GNOME's existing objects...
            const messageList = imports.ui.main.panel.statusArea.dateMenu._messageList;
            messageList._sectionList.get_children().forEach(s => s.clear())
        });
    }
});
