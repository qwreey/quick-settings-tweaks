import Adw from "gi://Adw"
import GObject from "gi://GObject"

import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js"

import { baseGTypeName, Group, Switch } from "../libs/prefComponents.js"

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

        // DateMenu
        Group({
            parent: this,
            title: _("Date Menu"),
            description: _("Adjust Date Menu layout"),
        },[
            Switch({
                settings,
                title: _("Remove Notifications"),
                subtitle: _("Hide notifications on date menu.\n*this option removes media control on date menu too*"),
                bind: "datemenu-remove-notifications",
            }),
            Switch({
                settings,
                title: _("Remove Media Control"),
                subtitle: _("Hide media control on date menu."),
                bind: "datemenu-remove-media-control",
            }),
        ])
    }
})
