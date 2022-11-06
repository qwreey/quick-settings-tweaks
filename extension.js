const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const Features = Me.imports.features
const { logger } = Me.imports.libs.utility
var loaded

// handling extension
function enable() {
    logger("Loading ...")

    let settings = ExtensionUtils.getSettings(Me.metadata['settings-schema'])
    ExtensionUtils.initTranslations()

    // load features
    loaded = [
        new Features.dndQuickToggle.dndQuickToggleFeature(settings),
        new Features.buttonRemover.buttonRemoverFeature(settings),
        new Features.notifications.notificationsFeature(settings),
        new Features.volumeMixer.volumeMixerFeature(settings),
        new Features.dateMenu.dateMenuFeature(settings)
    ]
    for (const feature of loaded) {
        logger(`Loading feature '${feature.constructor.name}'`)
        feature.load()
    }

    logger("Loaded")
}

function disable() {
    logger("Unloading ...")

    if (!loaded) return
    for (const feature of loaded) {
        logger(`Unload feature '${feature.constructor.name}'`)
        feature.unload()
    }
    loaded = null

    logger("Diabled")
}
