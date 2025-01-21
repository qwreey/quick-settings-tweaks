import Gtk from "gi://Gtk"
import Gdk from "gi://Gdk"
import Gio from "gi://Gio"

import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js"
import { volumeMixerPage } from "./prefPages/volumeMixer.js"
import { WidgetsPage } from "./prefPages/widgets.js"
import { TogglesPage } from "./prefPages/toggles.js"
import { OtherPage } from "./prefPages/other.js"
import { AboutPage } from "./prefPages/about.js"
import { MenuPage } from "./prefPages/menu.js"
import Adw from "gi://Adw"

var pageList = [
	// volumeMixerPage,
	WidgetsPage,
	TogglesPage,
	MenuPage,
	OtherPage,
	AboutPage,
]

export default class QstExtensionPreferences extends ExtensionPreferences {
	appendIconPath(path: string) {
		const iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default())
		if (!iconTheme.get_search_path().includes(path))
			iconTheme.add_search_path(path)
	}
	readExtensionFile(path: string) {
		const decoder = new TextDecoder()
		const file = Gio.File.new_for_path(`${this.path}/${path}`)
		const content = file.load_contents(null)[1]
		return decoder.decode(content)
	}

	async fillPreferencesWindow(window: Adw.PreferencesWindow) {
		let settings = this.getSettings()

		window.set_search_enabled(true)
		window.set_default_size(640, 640)

		// Register icon path
		this.appendIconPath(this.path + "/media")
		this.appendIconPath(this.path + "/media/contributors")

		for (const page of pageList) {
			window.add(new page(settings, this, window))
		}
	}
}
