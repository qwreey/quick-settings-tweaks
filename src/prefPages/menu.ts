import Adw from "gi://Adw"
import GObject from "gi://GObject"

import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js"

import {
    baseGTypeName,
    Switch,
    Adjustment,
    Group,
} from "../libs/prefComponents.js"

export const MenuPage = GObject.registerClass({
    GTypeName: baseGTypeName+'MenuPage',
}, class MenuPage extends Adw.PreferencesPage {
    constructor(settings) {
        // group config
        super({
            name: 'Menu',
            title: _('Menu'),
            iconName: 'user-available-symbolic',
        })

        // Animation
        Group({
            parent: this,
            title: _("Animation"),
            description: _("Animate on toggle menu open and close"),
            headerSuffix: Switch({
                settings,
                bind: "menu-animation-enabled",
            }),
        },[
            Adjustment({
                settings,
                title: _("Blur Radius"),
                subtitle: _("Set this to 0 to disable blur effect"),
                sensitiveBind: "menu-animation-enabled",
                bind: "menu-animation-background-blur-radius",
                max: 32,
            }),
            Adjustment({
                settings,
                title: _("Opacity"),
                subtitle: _("Set this to 255 to opaque, and 0 to transparent"),
                sensitiveBind: "menu-animation-enabled",
                bind: "menu-animation-background-opacity",
                max: 255,
            }),
            Adjustment({
                settings,
                title: _("X Scale"),
                subtitle: _("Adjust background x scale, 1000 means 1.0 scale"),
                sensitiveBind: "menu-animation-enabled",
                bind: "menu-animation-background-scale-x",
                max: 4000,
            }),
            Adjustment({
                settings,
                title: _("Y Scale"),
                subtitle: _("Adjust background y scale, 1000 means 1.0 scale"),
                sensitiveBind: "menu-animation-enabled",
                bind: "menu-animation-background-scale-y",
                max: 4000,
            }),
        ])
    }
})
