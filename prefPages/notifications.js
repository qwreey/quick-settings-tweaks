import Adw from "gi://Adw"
import GObject from "gi://GObject"

import {
    baseGTypeName,
    makeRow,
    makeSwitch,
    makeAdjustment,
    makeDropdown
} from "../libs/prefComponents.js"

export var notificationsPage = GObject.registerClass({
    GTypeName: baseGTypeName+'notificationsPage',
}, class notificationsPage extends Adw.PreferencesPage {
    constructor(settings) {
        // group config
        super({
            name: 'notifications',
            title: 'Notifications',
            iconName: 'user-available-symbolic'
        })

        // description / enable
        const descriptionGroup = new Adw.PreferencesGroup()
        makeRow({
            parent: descriptionGroup,
            title: "Add notifications widget",
            subtitle: "Reference from https://github.com/Aylur/gnome-extensions\nSource code of that is not used on this extension"
        })
        makeSwitch({
            parent: descriptionGroup,
            title: "Visible",
            subtitle: "Turn on to make the notification widget visible on the Quick Settings panel",
            value: settings.get_boolean("notifications-enabled"),
            bind: [settings, "notifications-enabled"]
        })
        this.add(descriptionGroup)

        // general
        const generalGroup = new Adw.PreferencesGroup({ title: "General" })
        this.add(generalGroup)
        makeAdjustment({
            parent: generalGroup,
            max: 1280,
            title: "Max height",
            subtitle: "Set maximum height of the Notifications widget. default is 292",
            value: settings.get_int("notifications-max-height"),
            bind: [settings, "notifications-max-height"],
        })
        makeDropdown({
            parent: generalGroup,
            title: "Position",
            subtitle: "Set Notifications widget position",
            value: settings.get_string('notifications-position'),
            type: "string",
            bind: [settings, 'notifications-position'],
            items: [
                {name: "Top", value: "top"},
                {name: "Bottom", value: "bottom"}
            ]
        })
        makeSwitch({
            parent: generalGroup,
            title: "Attach to QS panel",
            value: settings.get_boolean("notifications-integrated"),
            subtitle: "Do not separate Quick Settings and Notifications widgets, \byou should enable this option because separated panels can make many visual bugs\n(such as margin or padding not matching with the theme)",
            bind: [settings, "notifications-integrated"]
        })
        makeSwitch({
            parent: generalGroup,
            title: "Auto Hide",
            value: settings.get_boolean("notifications-hide-when-no-notifications"),
            subtitle: "Hide the Notifications widget when have no notifications",
            bind: [settings, "notifications-hide-when-no-notifications"]
        })
        makeSwitch({
            parent: generalGroup,
            title: "Use native controls",
            value: settings.get_boolean("notifications-use-native-controls"),
            subtitle: "Use native dnd switch and clear button",
            bind: [settings, "notifications-use-native-controls"]
        })
    }
})
