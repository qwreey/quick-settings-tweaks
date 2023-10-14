import Gtk from "gi://Gtk"
import Gdk from "gi://Gdk"

import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js"
import { volumeMixerPage } from "./prefPages/volumeMixer.js"
import { notificationsPage } from "./prefPages/notifications.js"
import { quickTogglesPage } from "./prefPages/quickToggles.js"
import { otherPage } from "./prefPages/other.js"
import { aboutPage } from "./prefPages/about.js"

var pageList = [
    volumeMixerPage,
    notificationsPage,
    quickTogglesPage,
    otherPage,
    aboutPage,
]

export default class QstExtensionPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        let settings = this.getSettings()
        
        window.set_search_enabled(true)
        window.set_default_size(640, 640)

        // register media path
        const iconPath = `${this.path}/media`;
        const iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default());
        if (!iconTheme.get_search_path().includes(iconPath))
            iconTheme.add_search_path(iconPath)

        for (const page of pageList) {
            window.add(new page(settings, this.metadata))
        }
    }
}
