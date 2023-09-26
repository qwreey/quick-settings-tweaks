import GObject from "gi://GObject"
import St from "gi://St"
import Clutter from "gi://Clutter"
import * as Calendar from "resource:///org/gnome/shell/ui/calendar.js"
import { DateMenuButton } from "resource:///org/gnome/shell/ui/dateMenu.js"
import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js"

import { fixStScrollViewScrollbarOverflow } from "../libs/utility.js"
import { DateMenu } from "./gnome.js"

const NoNotifPlaceholder = GObject.registerClass(class NoNotifPlaceholder extends St.BoxLayout {
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

const ClearNotificationsButton = GObject.registerClass(class ClearNotificationsButton extends St.Button {
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

export const Notifications = GObject.registerClass(
class Notifications extends St.BoxLayout{

    // prepare date menu items
    _prepareDateMenu() {
        // create gnome datemenu
        this.datemenu = new DateMenuButton()

        // notifications
        let messageList = this.messageList = this.datemenu._messageList
        this.notificationList = messageList._notificationSection
        this.nativeDndSwitch = messageList._dndButton
        this.nativeClearButton = messageList._clearButton

        // media controls
        this.mediaSection = messageList._mediaSection
        messageList._sectionList.remove_child(this.mediaSection);
        this.mediaSection.disconnectObject(messageList);

        // notification list scroll
        this.list = messageList._scrollView
        this.list.get_parent().remove_child(this.list)
        this.add_child(this.list) // mount
        fixStScrollViewScrollbarOverflow(this.list) // fix fade effect
    }

    // Create 'Notifications' text and ClearButton
    _createHeaderArea() {
        // header / title
        let headerBox = new St.BoxLayout({ style_class: "QSTWEAKS-notifications-header" })
        let titleLabel = new St.Label({
            text: _('Notifications'),
            style_class: "QSTWEAKS-notifications-title",
            y_align: Clutter.ActorAlign.CENTER,
            x_align: Clutter.ActorAlign.START,
            x_expand: true
        })
        headerBox.add_child(titleLabel)

        // clear button
        if (!this.options.useNativeControls) {
            let clearButton = this.clearButton = new ClearNotificationsButton()
            clearButton.connect("clicked", () => {
                this.messageList._sectionList.get_children().forEach(s => s.clear())
            })
            headerBox.add_child(clearButton)
        }

        // mount
        this.insert_child_at_index(headerBox, 0)
    }

    // Create 'NoNotification' placeholder
    _createNoNotificationArea() {
        // container
        let noNotiBox = this.noNotiBox = new St.BoxLayout({ x_align: Clutter.ActorAlign.CENTER })
        noNotiBox.style_class = "QSTWEAKS-notifications-no-notifications-box"
        noNotiBox.hide()

        // no notifications text
        noNotiBox.add_child(new NoNotifPlaceholder())

        // mount
        this.add_child(noNotiBox)
    }

    // sync no-notification placeholder and clear button
    _updateNoNotifications() {
        if (this.nativeClearButton.reactive) {
            this.list.show()
            this.noNotiBox.hide()
            if (this.clearButton) this.clearButton.show()
            if (this.options.hideWhenNoNotifications) this.show()
        } else {
            this.list.hide()
            this.noNotiBox.show()
            if (this.clearButton) this.clearButton.hide()
            if (this.options.hideWhenNoNotifications) this.hide()
        }
    }

    // Sync
    _syncNotifications() {
        // sync notifications from gnome stock notifications
        DateMenu._messageList._notificationSection._messages.forEach((notification)=>{
            // clone message
            this.notificationList.addMessage(new Calendar.NotificationMessage(notification.notification))
        })

        // sync no-notification placeholder and clear button
        this.nativeClearButton.connect('notify::reactive', this._updateNoNotifications.bind(this))
        this._updateNoNotifications()
    }

    _createNativeControls() {
        // unmount dnd/clear/text from parent
        {
            let parent = this.nativeClearButton.get_parent()
            parent.remove_child(this.nativeClearButton)
            parent.remove_child(this.nativeDndSwitch)
            parent.remove_child(this.nativeDndText = parent.first_child)
        }

        // create container
        let nativeControlBox = this.nativeControlBox = new St.BoxLayout()
        nativeControlBox.add_child(this.nativeDndText)
        nativeControlBox.add_child(this.nativeDndSwitch)
        nativeControlBox.add_child(this.nativeClearButton)
        this.add_child(nativeControlBox)
    }

    // options {
    //     hideWhenNoNotifications
    //     useNativeControls
    // }
    _init(options) {
        super._init({
            vertical: true,
        })
        this.options = options

        this._prepareDateMenu()
        this._createHeaderArea()
        this._createNoNotificationArea()
        this._syncNotifications()
        if (options.useNativeControls) this._createNativeControls() // native clear/dnd

        this.connect('destroy', () => {
            this.datemenu._eventSource.destroy();
            this.datemenu.destroy();
        });
    }
})
