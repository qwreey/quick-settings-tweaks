import Adw from "gi://Adw"
import GObject from "gi://GObject"

import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js"

import {
    baseGTypeName,
    makeRow,
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
            title: _('Notifications'),
            iconName: 'user-available-symbolic',
        })

        // description / enable
        const descriptionGroup = new Adw.PreferencesGroup()
        makeRow({
            parent: descriptionGroup,
            title: _("Add notifications widget"),
            subtitle: _("Reference from https://github.com/Aylur/gnome-extensions\nSource code of that is not used on this extension"),
        })
        makeSwitch({
            parent: descriptionGroup,
            title: _("Visible"),
            subtitle: _("Turn on to make the notification widget visible on the Quick Settings panel"),
            value: settings.get_boolean("notifications-enabled"),
            bind: [settings, "notifications-enabled"],
        })
        this.add(descriptionGroup)

        // general
        const generalGroup = new Adw.PreferencesGroup({ title: "General" })
        this.add(generalGroup)
        makeAdjustment({
            parent: generalGroup,
            max: 1280,
            title: _("Max height"),
            subtitle: _("Set maximum height of the Notifications widget. default is 292"),
            value: settings.get_int("notifications-max-height"),
            bind: [settings, "notifications-max-height"],
        })
        makeDropdown({
            parent: generalGroup,
            title: _("Position"),
            subtitle: _("Set Notifications widget position"),
            value: settings.get_string('notifications-position'),
            type: "string",
            bind: [settings, 'notifications-position'],
            items: [
                {name: "Top", value: "top"},
                {name: "Bottom", value: "bottom"},
            ],
        })
        makeSwitch({
            parent: generalGroup,
            title: _("Attach to QS panel"),
            subtitle: _("Do not separate Quick Settings and Notifications widgets, \byou should enable this option because separated panels can make many visual bugs\n(such as margin or padding not matching with the theme)"),
            value: settings.get_boolean("notifications-integrated"),
            bind: [settings, "notifications-integrated"],
        })
        makeSwitch({
            parent: generalGroup,
            title: _("Auto Hide"),
            subtitle: _("Hide the Notifications widget when have no notifications"),
            value: settings.get_boolean("notifications-hide-when-no-notifications"),
            bind: [settings, "notifications-hide-when-no-notifications"],
        })
        makeSwitch({
            parent: generalGroup,
            title: _("Use native controls"),
            subtitle: _("Use native dnd switch and clear button"),
            value: settings.get_boolean("notifications-use-native-controls"),
            bind: [settings, "notifications-use-native-controls"],
        })
    }
})
