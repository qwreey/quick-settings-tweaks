import Adw from "gi://Adw"
import GObject from "gi://GObject"

import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js"

import {
    baseGTypeName,
    makeSwitch,
    makeAdjustment,
    makeDropdown
} from "../libs/prefComponents.js"

export const notificationsPage = GObject.registerClass({
    GTypeName: baseGTypeName+'notificationsPage',
}, class notificationsPage extends Adw.PreferencesPage {
    constructor(settings) {
        // group config
        super({
            name: 'notifications',
            title: _('Noti&Media'),
            iconName: 'user-available-symbolic',
        })

        // media
        const mediaGroup = new Adw.PreferencesGroup({
            title: _("Media Controls widget"),
            headerSuffix: makeSwitch({
                title: "",
                value: settings.get_boolean("media-enabled"),
                bind: [settings, "media-enabled"]
            }),
            description: _("Turn on to make the Media Control widget visible on the Quick Settings panel"),
        })
        makeSwitch({
            parent: mediaGroup,
            title: _("Compact Mode"),
            subtitle: _("Make Media Controls widget smaller\nMake it more similar in size to the notification message"),
            value: settings.get_boolean("media-compact"),
            bind: [settings, "media-compact"],
            sensitiveBind: [settings, "media-enabled"],
        })
        makeSwitch({
            parent: mediaGroup,
            title: _("Show Progress Bar"),
            subtitle: _("Add Progress Bar under description"),
            value: settings.get_boolean("media-show-progress"),
            bind: [settings, "media-show-progress"],
            sensitiveBind: [settings, "media-enabled"],
        })
        
        this.add(mediaGroup)

        // notification
        const notificationGroup = new Adw.PreferencesGroup({
            title: _("Notification Widget"),
            headerSuffix: makeSwitch({
                title: "",
                value: settings.get_boolean("notifications-enabled"),
                bind: [settings, "notifications-enabled"],
            }),
            description: _("Turn on to make the notification widget visible on the Quick Settings panel"),
        })
        makeAdjustment({
            parent: notificationGroup,
            max: 2048,
            title: _("Max height"),
            subtitle: _("Set maximum height of the Notifications widget. default is 292"),
            value: settings.get_int("notifications-max-height"),
            bind: [settings, "notifications-max-height"],
            sensitiveBind: [settings, "notifications-enabled"],
        })
        makeSwitch({
            parent: notificationGroup,
            title: _("Auto Hide"),
            subtitle: _("Hide the Notifications widget when have no notifications"),
            value: settings.get_boolean("notifications-autohide"),
            bind: [settings, "notifications-autohide"],
            sensitiveBind: [settings, "notifications-enabled"],
        })
        makeSwitch({
            parent: notificationGroup,
            title: _("Use native controls"),
            subtitle: _("Use native dnd switch and clear button"),
            value: settings.get_boolean("notifications-use-native-controls"),
            bind: [settings, "notifications-use-native-controls"],
            sensitiveBind: [settings, "notifications-enabled"],
        })
        makeSwitch({
            parent: notificationGroup,
            title: _("Compact Mode"),
            subtitle: _("Make notifications smaller"),
            value: settings.get_boolean("notifications-compact"),
            bind: [settings, "notifications-compact"],
            sensitiveBind: [settings, "notifications-enabled"],
        })
        this.add(notificationGroup)

        // DateMenu
        const datemenuGroup = new Adw.PreferencesGroup({
            title: _("Date Menu"),
            description: _("Adjust Date Menu layout"),
        })
        makeSwitch({
            parent: datemenuGroup,
            title: _("Remove Notifications"),
            subtitle: _("Hide notifications on date menu.\n*this option removes media control on date menu too*"),
            value: settings.get_boolean("datemenu-remove-notifications"),
            bind: [settings, "datemenu-remove-notifications"]
        })
        makeSwitch({
            parent: datemenuGroup,
            title: _("Remove Media Control"),
            subtitle: _("Hide media control on date menu."),
            value: settings.get_boolean("datemenu-remove-media-control"),
            bind: [settings, "datemenu-remove-media-control"]
        })
        this.add(datemenuGroup)
    }
})
