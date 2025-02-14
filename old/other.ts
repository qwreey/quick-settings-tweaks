import Adw from "gi://Adw"
import GObject from "gi://GObject"
import Gio from "gi://Gio"
import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js"
import Config from "../config.js"
import type QstExtensionPreferences from "../prefs.js"
import {
	Group,
	SwitchRow,
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
	}
})
