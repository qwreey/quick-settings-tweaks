import Adw from "gi://Adw"
import GObject from "gi://GObject"
import Gio from "gi://Gio"
import Gtk from "gi://Gtk"
import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js"
import Config from "../config.js"
import type QstExtensionPreferences from "../prefs.js"
import {
	Group,
	Row,
	SwitchRow,
	ResetButton,
	ToggleButtonRow,
	UpDownButton,
	DialogRow,
	setScrollToFocus,
	delayedSetScrollToFocus,
	fixPageScrollIssue,
} from "../libs/prefComponents.js"

export const OtherPage = GObject.registerClass({
	GTypeName: Config.baseGTypeName+"OtherPage",
}, class OtherPage extends Adw.PreferencesPage {
	constructor(settings: Gio.Settings, _prefs: QstExtensionPreferences, window: Adw.PreferencesWindow) {
		super({
			name: "Other",
			title: _("Other"),
			iconName: "preferences-system-symbolic",
		})
		fixPageScrollIssue(this)

		// DateMenu
		Group({
			parent: this,
			title: _("Date Menu"),
			description: _("Adjust Date Menu layout"),
		},[
			SwitchRow({
				settings,
				title: _("Hide Notifications"),
				subtitle: _("Hide notifications on date menu.\n*this option removes media control on date menu too*"),
				bind: "datemenu-remove-notifications",
			}),
			SwitchRow({
				settings,
				title: _("Hide Media Control"),
				subtitle: _("Hide media control on date menu."),
				bind: "datemenu-remove-media-control",
			}),
		])
	}
})
