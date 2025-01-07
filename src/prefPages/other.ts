import Adw from "gi://Adw"
import GObject from "gi://GObject"

import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js"

import { baseGTypeName, makeSwitch } from "../libs/prefComponents.js"

export const otherPage = GObject.registerClass({
    GTypeName: baseGTypeName+'otherPage',
}, class otherPagePage extends Adw.PreferencesPage {
    constructor(settings) {
        // group config
        super({
            name: 'other',
            title: _('Other'),
            iconName: 'non-starred-symbolic'
        })
        
        // description / enable
        const group = new Adw.PreferencesGroup()
        makeSwitch({
            parent: group,
            title: _("Fix Weather Widget Overflow"),
            subtitle: _("Fix overflow visual bug of weather widget in datemenu"),
            value: settings.get_boolean("datemenu-fix-weather-widget"),
            bind: [settings, "datemenu-fix-weather-widget"]
        })
        makeSwitch({
            parent: group,
            title: _("Remove Notifications On Date Menu"),
            subtitle: _("Hide notifications on date menu.\n*this option removes media control on date menu too*"),
            value: settings.get_boolean("datemenu-remove-notifications"),
            bind: [settings, "datemenu-remove-notifications"]
        })
        makeSwitch({
            parent: group,
            title: _("Remove Media Control On Date Menu"),
            subtitle: _("Hide media control on date menu."),
            value: settings.get_boolean("datemenu-remove-media-control"),
            bind: [settings, "datemenu-remove-media-control"]
        })
        makeSwitch({
            parent: group,
            title: _("Do not adjust the border radius of contents."),
            subtitle: _("Don't adjust the border of messages and media controls."),
            value: settings.get_boolean("disable-adjust-content-border-radius"),
            bind: [settings, "disable-adjust-content-border-radius"]
        })
        makeSwitch({
            parent: group,
            title: _("Do not remove the shadow of contents."),
            subtitle: _("Don't remove the shadow of messages and media controls."),
            value: settings.get_boolean("disable-remove-shadow"),
            bind: [settings, "disable-remove-shadow"]
        })
        this.add(group)
    }
})
