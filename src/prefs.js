import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js"
import { volumeMixerPage } from "./prefPages/volumeMixer.js"
import { inputOutputPage } from "./prefPages/inputOutput.js"
import { notificationsPage } from "./prefPages/notifications.js"
import { mediaControlPage } from "./prefPages/mediaControl.js"
import { quickTogglesPage } from "./prefPages/quickToggles.js"
import { otherPage } from "./prefPages/other.js"
import { aboutPage } from "./prefPages/about.js"


var pageList = [
    volumeMixerPage,
    inputOutputPage,
    notificationsPage,
    mediaControlPage,
    quickTogglesPage,
    otherPage,
    aboutPage
]

export default class QstExtensionPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        let settings = this.getSettings()
        
        for (const page of pageList) {
            window.add(new page(settings, this.metadata))
        }
    }
}
