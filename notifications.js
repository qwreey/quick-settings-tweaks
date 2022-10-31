const { GObject, St, Clutter } = imports.gi;
const Main = imports.ui.main
const Calendar = imports.ui.calendar;

var Notifications = GObject.registerClass(
    class Notifications extends St.BoxLayout{
        _init(options={}){
            super._init({
                vertical: true,
                style_class: 'popup-menu-content quick-settings qwreey-notifications'
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

            let headerBox = new St.BoxLayout()
            let label = new St.Label({ text: _('Notifications'), y_align: Clutter.ActorAlign.CENTER })
            label.style_class = "qwreey-notifications-title"
            headerBox.add_child(label)
            this.add_child(headerBox)
            this.add_child(this.list)

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
