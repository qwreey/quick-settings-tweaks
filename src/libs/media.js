import * as Mpris from "resource:///org/gnome/shell/ui/mpris.js"

new Mpris.MediaSection()
// export const Notifications = GObject.registerClass(
//     class Notifications extends St.BoxLayout {

//         // prepare date menu items
//         _prepareDateMenu() {
//             // create gnome datemenu
//             // this.datemenu = new DateMenuButton()

//             // notifications
//             // let messageList = this.messageList = new Calendar.CalendarMessageList() //this.datemenu._messageList
//             // this.notificationList = new Calendar.NotificationSection() //messageList._notificationSection
//             // this.nativeDndSwitch = messageList._dndButton
//             // this.nativeClearButton = messageList._clearButton

//             // media controls
//             this.mediaSection =  // messageList._mediaSection
//             // messageList._sectionList.remove_child(this.mediaSection);
//             // this.mediaSection.disconnectObject(messageList);

//             // notification list scroll
//             this._notificationSection = new Calendar.NotificationSection()
//             this._notificationScroll =  new St.ScrollView({
//                 style_class: 'vfade',
//                 overlay_scrollbars: true,
//                 x_expand: true, y_expand: true,
//             })
//             this._notificationScroll.child = this._notificationSection
//             this.add_child(this._notificationScroll) // mount

//             // this.list = messageList._scrollView
//             // this.list.get_parent().remove_child(this.list)
//             // this.add_child(this.list) // mount
//             fixStScrollViewScrollbarOverflow(this.list) // fix fade effect
//         }

//         // Create 'Notifications' text and ClearButton
//         _createHeaderArea() {
//             // header / title
//             let headerBox = new St.BoxLayout({ style_class: "QSTWEAKS-notifications-header" })
//             let titleLabel = new St.Label({
//                 text: _('Notifications'),
//                 style_class: "QSTWEAKS-notifications-title",
//                 y_align: Clutter.ActorAlign.CENTER,
//                 x_align: Clutter.ActorAlign.START,
//                 x_expand: true
//             })
//             headerBox.add_child(titleLabel)

//             // clear button
//             if (!this.options.useNativeControls) {
//                 let clearButton = this.clearButton = new ClearButton()
//                 clearButton.connect("clicked", () => {
//                     this.messageList._sectionList.get_children().forEach(s => s.clear())
//                 })
//                 headerBox.add_child(clearButton)
//             }

//             // mount
//             this.insert_child_at_index(headerBox, 0)
//         }

//         // Create 'NoNotification' placeholder
//         _createNoNotificationArea() {
//             // container
//             let noNotiBox = this.noNotiBox = new St.BoxLayout({ x_align: Clutter.ActorAlign.CENTER })
//             noNotiBox.style_class = "QSTWEAKS-notifications-no-notifications-box"
//             noNotiBox.hide()

//             // no notifications text
//             noNotiBox.add_child(new Placeholder())

//             // mount
//             this.add_child(noNotiBox)
//         }

//         // sync no-notification placeholder and clear button
//         _updateNoNotifications() {
//             if (this.nativeClearButton.reactive) {
//                 this.list.show()
//                 this.noNotiBox.hide()
//                 if (this.clearButton) this.clearButton.show()
//                 if (this.options.hideWhenNoNotifications) this.show()
//             } else {
//                 this.list.hide()
//                 this.noNotiBox.show()
//                 if (this.clearButton) this.clearButton.hide()
//                 if (this.options.hideWhenNoNotifications) this.hide()
//             }
//         }

//         // Sync
//         _syncNotifications() {
//             // sync notifications from gnome stock notifications
//             DateMenu._messageList._notificationSection._messages.forEach((notification) => {
//                 // clone message
//                 this.notificationList.addMessage(new Calendar.NotificationMessage(notification.notification))
//             })

//             // sync no-notification placeholder and clear button
//             this.nativeClearButton.connect('notify::reactive', this._updateNoNotifications.bind(this))
//             this._updateNoNotifications()
//         }

//         _createNativeControls() {
//             // unmount dnd/clear/text from parent
//             {
//                 let parent = this.nativeClearButton.get_parent()
//                 parent.remove_child(this.nativeClearButton)
//                 parent.remove_child(this.nativeDndSwitch)
//                 parent.remove_child(this.nativeDndText = parent.first_child)
//             }

//             // create container
//             let nativeControlBox = this.nativeControlBox = new St.BoxLayout()
//             nativeControlBox.add_child(this.nativeDndText)
//             nativeControlBox.add_child(this.nativeDndSwitch)
//             nativeControlBox.add_child(this.nativeClearButton)
//             this.add_child(nativeControlBox)
//         }

//         // options {
//         //     hideWhenNoNotifications
//         //     useNativeControls
//         // }
//         _init(options) {
//             super._init({
//                 vertical: true,
//             })
//             this.options = options

//             this._prepareDateMenu()
//             this._createHeaderArea()
//             this._createNoNotificationArea()
//             this._syncNotifications()
//             if (options.useNativeControls) this._createNativeControls() // native clear/dnd

//             this.connect('destroy', () => {
//                 log("destroy notificationList")
//                 this.notificationList.destroy()
//                 this.notificationList = null
//                 log("destroy nativeDndSwitch")
//                 this.nativeDndSwitch.destroy()
//                 this.nativeDndSwitch = null
//                 log("destroy nativeClearButton")
//                 this.nativeClearButton.destroy()
//                 this.nativeClearButton = null
//                 // log("destroy mediaSection")
//                 // this.mediaSection.destroy()
//                 // this.mediaSection = null
//                 log("destroy messageList")
//                 this.messageList.destroy()
//                 this.messageList = null
//                 log("destroy list")
//                 this.list.destroy()
//                 this.list = null

//                 log("destroy event source")
//                 this.datemenu._eventSource.destroy();
//                 log("destroy datemenu")
//                 this.datemenu.destroy();
//                 this.datemenu = null
//             });
//         }
//     })
