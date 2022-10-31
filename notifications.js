const { GObject, St, Clutter } = imports.gi;
const Main = imports.ui.main
const Calendar = imports.ui.calendar;

var Notifications = GObject.registerClass(
    class Notifications extends St.BoxLayout{
        _init(options={}){
            super._init({
                vertical: true,
                style_class: 'popup-menu-content quick-settings qwreey-notifications'
            })

            let datemenu = new imports.ui.dateMenu.DateMenuButton()
            Main.test = this
            this.notificationList = datemenu._messageList._notificationSection

            this.dndButton = datemenu._messageList._dndButton
            this.dndSwitch = datemenu._messageList._dndSwitch
            this.clearButton = datemenu._messageList._clearButton
            this.clearButton.get_parent().remove_child(this.clearButton)

            this.list = datemenu._messageList._scrollView
            this.list.get_parent().remove_child(this.list)

            this.mediaSection = datemenu._messageList._mediaSection
            this.mediaSection.get_parent().remove_child(this.mediaSection)
            this.mediaSection.style_class += " qwreey-media"

            let headerBox = new St.BoxLayout()
            let label = new St.Label({ text: _('Notifications'), y_align: Clutter.ActorAlign.CENTER })
            label.style_class = "qwreey-notifications-title"
            headerBox.add_child(label)
            this.add_child(headerBox)
            this.add_child(this.list)

            // dnd button
            if (options.dndSwitch) {
                let dndBox = new St.BoxLayout()
                dndBox.add_child(this.dndButton)
                dndBox.add_child(this.dndSwitch)
                dndBox.add_child(this.clearButton)
                this.add_child(dndBox)
            } else {
                headerBox.add_child(this.clearButton)
            }


            //sync notifications
            let stockNotifications = Main.panel.statusArea.dateMenu._messageList._notificationSection
            let notifications = stockNotifications._messages
            notifications.forEach(n => {
                let notification = new Calendar.NotificationMessage(n.notification)
                this.notificationList.addMessage(notification)
            })

            //hide on zero notifs
            this.clearButton.connect('notify::reactive', () => {
                this.clearButton.reactive ? this.show() : this.hide()
            })
            if(!this.clearButton.reactive) this.hide()

            this.connect('destroy', () => {
                datemenu.destroy()
                datemenu = null
            })
        }
    }
)
