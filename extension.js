import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import { dndQuickToggleFeature } from "./features/dndQuickToggle.js"
import { unsafeQuickToggleFeature } from "./features/unsafeQuickToggle.js"
import { notificationsFeature } from "./features/notifications.js"
import { volumeMixerFeature } from "./features/volumeMixer.js"
import { dateMenuFeature } from "./features/dateMenu.js"
import { buttonRemoverFeature } from "./features/buttonRemover.js"
import { inputOutputFeature } from "./features/inputOutput.js"
import { logger } from "./libs/utility.js"
import { QuickSettingsGrid } from "./libs/gnome.js"

export default class QstExtension extends Extension {
    disable() {
        logger("Unloading ...")
        let start = +Date.now()

        // unload menu open tracker
        QuickSettingsGrid.disconnect(this.menuOpenTracker)
        QuickSettingsGrid.disconnect(this.menuItemAddedTracker)

        // unload features
        for (const feature of this.features) {
            logger(`Unload feature '${feature.constructor.name}'`)
            feature.unload()
            feature.settings = null
        }

        // Null out
        this.menuItemAddedTracker = this.features = this.updating = this.menuOpenTracker = null

        logger("Diabled. " + (+new Date() - start) + "ms taken")
    }
    enable() {
        logger("Loading ...")
        let start = +Date.now()

        // load modules
        this.features = [
            new dndQuickToggleFeature(),
            new unsafeQuickToggleFeature(),
            new notificationsFeature(),
            new volumeMixerFeature(),
            new dateMenuFeature(),
            new buttonRemoverFeature(),
            new inputOutputFeature(),
        ]

        // load settings
        let settings = this.getSettings()

        // load features
        for (const feature of this.features) {
            logger(`Loading feature '${feature.constructor.name}'`)
            feature.settings = settings
            feature.load()
        }

        // load menu open tracker
        this.updating = false
        this.menuOpenTracker = QuickSettingsGrid.connect("notify::mapped",()=>{
            if (!QuickSettingsGrid.mapped) return
            this.updating = true
            for (const feature of this.features) {
                if (feature.onMenuOpen) feature.onMenuOpen()
            }
            this.updating = false
        })

        // load menu item added tracker
        this.menuItemAddedTracker = QuickSettingsGrid.connect("actor-added",()=>{
            if (this.updating) return
            this.updating = true
            for (const feature of this.features) {
                if (feature.onMenuItemAdded) feature.onMenuItemAdded()
            }
            this.updating = false
        })

        logger("Loaded. " + (+Date.now() - start) + "ms taken")
    }
}
