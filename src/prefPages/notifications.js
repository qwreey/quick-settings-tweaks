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
                value: settings.get_boolean("media-control-enabled"),
                bind: [settings, "media-control-enabled"]
            }),
            description: _("Turn on to make the Media Control widget visible on the Quick Settings panel"),
        })
        makeSwitch({
            parent: mediaGroup,
            title: _("Compact Mode"),
            subtitle: _("Make Media Controls widget smaller\nMake it more similar in size to the notification message"),
            value: settings.get_boolean("media-control-compact-mode"),
            bind: [settings, "media-control-compact-mode"],
            sensitiveBind: [settings, "media-control-enabled"],
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
            max: 1280,
            title: _("Max height"),
            subtitle: _("Set maximum height of the Notifications widget. default is 292"),
            value: settings.get_int("notifications-max-height"),
            bind: [settings, "notifications-max-height"],
            sensitiveBind: [settings, "notifications-enabled"],
        })
        makeDropdown({
            parent: notificationGroup,
            title: _("Position"),
            subtitle: _("Set Notifications widget position"),
            value: settings.get_string('notifications-position'),
            type: "string",
            bind: [settings, 'notifications-position'],
            items: [
                {name: _("Top"), value: "top"},
                {name: _("Bottom"), value: "bottom"},
            ],
            sensitiveBind: [settings, "notifications-enabled"],
        })
        makeSwitch({
            parent: notificationGroup,
            title: _("Attach to QS panel"),
            subtitle: _("Do not separate Quick Settings and Notifications widgets, \byou should enable this option because separated panels can make many visual bugs\n(such as margin or padding not matching with the theme)"),
            value: settings.get_boolean("notifications-integrated"),
            bind: [settings, "notifications-integrated"],
            sensitiveBind: [settings, "notifications-enabled"],
        })
        makeSwitch({
            parent: notificationGroup,
            title: _("Auto Hide"),
            subtitle: _("Hide the Notifications widget when have no notifications"),
            value: settings.get_boolean("notifications-hide-when-no-notifications"),
            bind: [settings, "notifications-hide-when-no-notifications"],
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
        this.add(notificationGroup)
    }
})
