import Adw from "gi://Adw"
import GObject from "gi://GObject"
import Gio from "gi://Gio"

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
	constructor(settings: Gio.Settings) {
		super({
			name: 'Menu',
			title: _('Menu'),
			iconName: 'user-available-symbolic',
		})

		// Overlay
		Group({
			parent: this,
			title: _("Overlay Mode"),
			description: _("Display toggle, power, and sound menus as overlay"),
			headerSuffix: Switch({
				settings,
				bind: "overlay-menu-enabled",
			}),
		},[
			Adjustment({
				settings,
				title: _("Overlay Width"),
				subtitle: _("Adjust overlay menu width\nSet this to 0 to disable adjusting"),
				sensitiveBind: "overlay-menu-enabled",
				bind: "overlay-menu-width",
				max: 2048,
			}),
			Adjustment({
				settings,
				title: _("Overlay Animation Duration"),
				subtitle: _("Custom open animation duration in microseconds\nSet this to 0 to disable custom animation"),
				sensitiveBind: "overlay-menu-enabled",
				bind: "overlay-menu-animate-duration",
				max: 4000,
			}),
		])

		// Animation
		Group({
			parent: this,
			title: _("Animation"),
			description: _("Add animation on toggle menu opening and closing\nTo get the best feel, turn on overlay mode"),
			headerSuffix: Switch({
				settings,
				bind: "menu-animation-enabled",
			}),
		},[
			Adjustment({
				settings,
				title: _("Open Duration"),
				subtitle: _("Open animation duration in microseconds"),
				sensitiveBind: "menu-animation-enabled",
				bind: "menu-animation-open-duration",
				max: 4000,
			}),
			Adjustment({
				settings,
				title: _("Close Duration"),
				subtitle: _("Close animation duration in microseconds"),
				sensitiveBind: "menu-animation-enabled",
				bind: "menu-animation-close-duration",
				max: 4000,
			}),
			Adjustment({
				settings,
				title: _("Background Blur Radius"),
				subtitle: _("Adjust background blur radius.\nSet this to 0 to disable blur effect"),
				sensitiveBind: "menu-animation-enabled",
				bind: "menu-animation-background-blur-radius",
				max: 32,
			}),
			Adjustment({
				settings,
				title: _("Background Opacity"),
				subtitle: _("Adjust background opacity.\nSet this to 255 to opaque, and 0 to transparent"),
				sensitiveBind: "menu-animation-enabled",
				bind: "menu-animation-background-opacity",
				max: 255,
			}),
			Adjustment({
				settings,
				title: _("Background X Scale"),
				subtitle: _("Adjust background x scale, 1000 means 1.0 scale"),
				sensitiveBind: "menu-animation-enabled",
				bind: "menu-animation-background-scale-x",
				max: 4000,
			}),
			Adjustment({
				settings,
				title: _("Background Y Scale"),
				subtitle: _("Adjust background y scale, 1000 means 1.0 scale"),
				sensitiveBind: "menu-animation-enabled",
				bind: "menu-animation-background-scale-y",
				max: 4000,
			}),
		])
	}
})
