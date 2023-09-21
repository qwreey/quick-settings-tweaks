import Adw from "gi://Adw"
import GObject from "gi://GObject"

import { baseGTypeName, makeSwitch } from "../libs/prefComponents.js"

export var otherPage = GObject.registerClass({
    GTypeName: baseGTypeName+'otherPage',
}, class otherPagePage extends Adw.PreferencesPage {
    constructor(settings) {
        // group config
        super({
            name: 'other',
            title: 'Other',
            iconName: 'non-starred-symbolic'
        })
        
        // description / enable
        const group = new Adw.PreferencesGroup()
        makeSwitch({
            parent: group,
            title: "Fix Weather Widget Overflow",
            value: settings.get_boolean("datemenu-fix-weather-widget"),
            subtitle: "Fix overflow visual bug of weather widget in datemenu",
            bind: [settings, "datemenu-fix-weather-widget"]
        })
        makeSwitch({
            parent: group,
            title: "Remove Notifications On Date Menu",
            value: settings.get_boolean("datemenu-remove-notifications"),
            subtitle: "Hide notifications on date menu.\n*this option removes media control on date menu too*",
            bind: [settings, "datemenu-remove-notifications"]
        })
        makeSwitch({
            parent: group,
            title: "Remove Media Control On Date Menu",
            value: settings.get_boolean("datemenu-remove-media-control"),
            subtitle: "Hide media control on date menu.",
            bind: [settings, "datemenu-remove-media-control"]
        })
        makeSwitch({
            parent: group,
            title: "Do not adjust the border radius of contents.",
            subtitle: "Don't adjust the border of messages and media controls.",
            value: settings.get_boolean("disable-adjust-content-border-radius"),
            bind: [settings, "disable-adjust-content-border-radius"]
        })
        makeSwitch({
            parent: group,
            title: "Do not remove the shadow of contents.",
            subtitle: "Don't remove the shadow of messages and media controls.",
            value: settings.get_boolean("disable-remove-shadow"),
            bind: [settings, "disable-remove-shadow"]
        })
        this.add(group)
    }
})
