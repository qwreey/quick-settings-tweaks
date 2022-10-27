const { GObject, St, Clutter } = imports.gi;
const Main = imports.ui.main
const Calendar = imports.ui.calendar;

var Notifications = GObject.registerClass(
    class Notifications extends St.BoxLayout{
        _init(){
            super._init({
                vertical: true,
                style_class: 'popup-menu-content quick-settings qwreey-notifications'
            })

            let datemenu = new imports.ui.dateMenu.DateMenuButton()
            this.notificationList = datemenu._messageList._notificationSection

            // Main.test._messageList._dndS
            // Main.test._messageList._dndSwitch
            this.clearBtn = datemenu._messageList._clearButton
            this.clearBtn.get_parent().remove_child(this.clearBtn)

            this.list = datemenu._messageList._scrollView
            this.list.get_parent().remove_child(this.list)

            this.mediaSection = datemenu._messageList._mediaSection
            this.mediaSection.get_parent().remove_child(this.mediaSection)
            this.mediaSection.style_class += " qwreey-media"

            let hbox = new St.BoxLayout()
            let label = new St.Label({ text: _('Notifications'), y_align: Clutter.ActorAlign.CENTER })
            label.style_class = "qwreey-notifications-title"
            hbox.add_child(label)
            hbox.add_child(this.clearBtn)

            this.add_child(hbox)
            this.add_child(this.list)

            //sync notifications
            let stockNotifications = Main.panel.statusArea.dateMenu._messageList._notificationSection
            let notifications = stockNotifications._messages
            notifications.forEach(n => {
                let notification = new Calendar.NotificationMessage(n.notification)
                this.notificationList.addMessage(notification)
            })

            //hide on zero notifs
            this.clearBtn.connect('notify::reactive', () => {
                this.clearBtn.reactive ? this.show() : this.hide()
            })
            if(!this.clearBtn.reactive) this.hide()

            this.connect('destroy', () => {
                datemenu.destroy()
                datemenu = null
            })
        }
    }
)
