import { Extension } from "resource:///org/gnome/shell/extensions/extension.js"
import { DndQuickToggleFeature } from "./features/dndQuickToggle.js"
import { UnsafeQuickToggleFeature } from "./features/unsafeQuickToggle.js"
import { NotificationsFeature } from "./features/notifications.js"
import { VolumeMixerFeature } from "./features/volumeMixer.js"
import { DateMenuFeature } from "./features/dateMenu.js"
import { ButtonRemoverFeature } from "./features/buttonRemover.js"
import { InputOutputFeature } from "./features/inputOutput.js"
import { logger } from "./libs/utility.js"
import { GnomeContext } from "./libs/gnome.js"
import { FeatureBase } from "./libs/feature.js"
import { MediaFeature } from "./features/media.js"

export default class QstExtension extends Extension {
    private features: FeatureBase[]

    disable() {
        logger("Unloading ...")
        let start = +Date.now()

        // unload menu open tracker
        // GnomeContext.QuickSettingsGrid.disconnect(this.menuOpenTracker)
        // GnomeContext.QuickSettingsGrid.disconnect(this.menuItemAddedTracker)

        // unload features
        for (const feature of this.features) {
            logger(`Unload feature '${feature.constructor.name}'`)
            feature.unload()
            feature.settings = null
        }

        // Null out
        // this.menuItemAddedTracker = this.features = this.updating = this.menuOpenTracker = null
        GnomeContext.unload()

        logger("Diabled. " + (+new Date() - start) + "ms taken")
    }

    enable() {
        logger("Loading ...")
        let start = +Date.now()

        GnomeContext.load()
        let settings = this.getSettings()

        // load modules
        global.context.unsafe_mode = true
        this.features = [
            new DndQuickToggleFeature(settings),
            new UnsafeQuickToggleFeature(settings),
            // new VolumeMixerFeature(),
            // new ButtonRemoverFeature(),
            // new InputOutputFeature(),
            new DateMenuFeature(settings),
            new NotificationsFeature(settings),
            new MediaFeature(settings),
        ]

        // load features
        for (const feature of this.features) {
            logger(`Loading feature '${feature.constructor.name}'`)
            feature.settings = settings
            feature.load()
        }

        // // load menu open tracker
        // this.updating = false
        // this.menuOpenTracker = GnomeContext.QuickSettingsGrid.connect("notify::mapped", () => {
        //     if (!GnomeContext.QuickSettingsGrid.mapped) return
        //     this.updating = true
        //     for (const feature of this.features) {
        //         if (feature.onMenuOpen) feature.onMenuOpen()
        //     }
        //     this.updating = false
        // })

        // // load menu item added tracker
        // this.menuItemAddedTracker = GnomeContext.QuickSettingsGrid.connect("child-added", () => {
        //     if (this.updating) return
        //     this.updating = true
        //     for (const feature of this.features) {
        //         if (feature.onMenuItemAdded) feature.onMenuItemAdded()
        //     }
        //     this.updating = false
        // })

        logger("Loaded. " + (+Date.now() - start) + "ms taken")
    }
}
