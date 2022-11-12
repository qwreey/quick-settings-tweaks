const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const Features = Me.imports.features
const { logger } = Me.imports.libs.utility
const { GLib } = imports.gi

class Extension {
    constructor() {
        logger("Init")
        this.features = [
            new Features.dndQuickToggle.dndQuickToggleFeature(),
            new Features.notifications.notificationsFeature(),
            new Features.volumeMixer.volumeMixerFeature(),
            new Features.dateMenu.dateMenuFeature(),
            new Features.buttonRemover.buttonRemoverFeature(),
            new Features.inputOutput.inputOutputFeature()
        ]
    }
    disable() {
        logger("Unloading ...")
    
        if (this.timeout) {
            GLib.Source.remove(this.timeout)
            this.timeout = null
        }
        for (const feature of this.features) {
            logger(`Unload feature '${feature.constructor.name}'`)
            feature.unload()
            feature.settings = null
        }
    
        logger("Diabled")
    }
    enable() {
        logger("Loading ...")
    
        let settings = ExtensionUtils.getSettings(Me.metadata['settings-schema'])
        ExtensionUtils.initTranslations(Me.metadata['gettext-domain'])
    
        // Add timeout for waitting other extensions such as GSConnect
        // This is necessary behavior due to ordering qs panel
        this.timeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 400, () => {
            for (const feature of this.features) {
                logger(`Loading feature '${feature.constructor.name}'`)
                feature.settings = settings
                feature.load()
            }
            logger("Loaded")
            return GLib.SOURCE_REMOVE
        })
    }
}

function init(meta) {
    return new Extension()
}
