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

export const WidgetsPage = GObject.registerClass({
	GTypeName: baseGTypeName+'WidgetsPage',
}, class WidgetsPage extends Adw.PreferencesPage {
	constructor(settings: Gio.Settings) {
		super({
			name: 'Widgets',
			title: _('Widgets'),
			iconName: 'user-available-symbolic',
		})

		// media
		Group({
			parent: this,
			title: _("Media Controls widget"),
			headerSuffix: Switch({
				settings,
				bind: "media-enabled",
			}),
			description: _("Turn on to make the Media Control widget visible on the Quick Settings panel"),
		},[
			Switch({
				settings,
				title: _("Compact Mode"),
				subtitle: _("Make Media Controls widget smaller\nMake it more similar in size to the notification message"),
				bind: "media-compact",
				sensitiveBind: "media-enabled",
			}),
			Switch({
				settings,
				title: _("Show Progress Bar"),
				subtitle: _("Add Progress Bar under description"),
				bind: "media-show-progress",
				sensitiveBind: "media-enabled",
			}),
			Switch({
				settings,
				title: _("Remove Shadow"),
				subtitle: _("Remove shadow from media message\nUse if your theme creates unnecessary shadows"),
				bind: "media-compact",
				sensitiveBind: "media-remove-shadow",
			}),
		])

		// notification
		Group({
			parent: this,
			title: _("Notification Widget"),
			headerSuffix: Switch({
				settings,
				bind: "notifications-enabled"
			}),
			description: _("Turn on to make the notification widget visible on the Quick Settings panel"),
		},[
			Adjustment({
				settings,
				title: _("Max height"),
				subtitle: _("Set maximum height of the Notifications widget. default is 292"),
				max: 2048,
				bind: "notifications-max-height",
				sensitiveBind: "notifications-enabled",
			}),
			Switch({
				settings,
				title: _("Auto Hide"),
				subtitle: _("Hide the Notifications widget when have no notifications"),
				bind: "notifications-autohide",
				sensitiveBind: "notifications-enabled",
			}),
			Switch({
				settings,
				title: _("Use native controls"),
				subtitle: _("Use native dnd switch and clear button"),
				bind: "notifications-use-native-controls",
				sensitiveBind: "notifications-enabled",
			}),
			Switch({
				settings,
				title: _("Compact Mode"),
				subtitle: _("Make notifications smaller"),
				bind: "notifications-compact",
				sensitiveBind: "notifications-enabled",
			}),
			Switch({
				settings,
				title: _("Remove Shadow"),
				subtitle: _("Remove shadow from notification message\nUse if your theme creates unnecessary shadows"),
				bind: "notifications-remove-shadow",
				sensitiveBind: "notifications-enabled",
			}),
		])

		// weather
		Group({
			parent: this,
			title: _("Weather Widget"),
			headerSuffix: Switch({
				settings,
				bind: "weather-enabled"
			}),
			description: _("Turn on to make the weather widget visible on the Quick Settings panel"),
		},[
			Switch({
				settings,
				title: _("Remove Shadow"),
				subtitle: _("Remove shadow from weather widget\nUse if your theme creates unnecessary shadows"),
				bind: "weather-remove-shadow",
				sensitiveBind: "weather-enabled",
			}),
		])
	}
})
