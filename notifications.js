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
            })

            let datemenu = new imports.ui.dateMenu.DateMenuButton()
            let messageList = datemenu._messageList
            this.notificationList = messageList._notificationSection

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

            // sync notifications
            let stockNotifications = Main.panel.statusArea.dateMenu._messageList._notificationSection
            let notifications = stockNotifications._messages
            notifications.forEach(n => {
                let notification = new Calendar.NotificationMessage(n.notification)
                this.notificationList.addMessage(notification)
            })

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