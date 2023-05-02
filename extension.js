const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const Features = Me.imports.features
const { logger } = Me.imports.libs.utility
const { QuickSettingsGrid } = Me.imports.libs.gnome
const { GLib } = imports.gi

class Extension {
    constructor() {}
    disable() {
        logger("Unloading ...")
        let start = +Date.now()

        // unload menu open tracker
        QuickSettingsGrid.disconnect(this.menuOpenTracker)
        this.menuOpenTracker = null

        // unload features
        for (const feature of this.features) {
            logger(`Unload feature '${feature.constructor.name}'`)
            feature.unload()
            feature.settings = null
        }
        this.features = null

        logger("Diabled. " + (+new Date() - start) + "ms taken")
    }
    enable() {
        logger("Loading ...")
        let start = +Date.now()

        // load modules
        this.features = [
            new Features.dndQuickToggle.dndQuickToggleFeature(),
            new Features.notifications.notificationsFeature(),
            new Features.volumeMixer.volumeMixerFeature(),
            new Features.dateMenu.dateMenuFeature(),
            new Features.buttonRemover.buttonRemoverFeature(),
            new Features.inputOutput.inputOutputFeature()
        ]

        // load settings
        let settings = ExtensionUtils.getSettings(Me.metadata['settings-schema'])
        ExtensionUtils.initTranslations(Me.metadata['gettext-domain'])

        // load features
        for (const feature of this.features) {
            logger(`Loading feature '${feature.constructor.name}'`)
            feature.settings = settings
            feature.load()
        }

        // load menu open tracker
        this.menuOpenTracker = QuickSettingsGrid.connect("notify::mapped",()=>{
            if (!QuickSettingsGrid.mapped) return
            logger(`Update layout`)
            for (const feature of this.features) {
                if (feature.onMenuOpen) feature.onMenuOpen()
            }
        })

        logger("Loaded. " + (+Date.now() - start) + "ms taken")
    }
}

function init(meta) {
    return new Extension()
}
