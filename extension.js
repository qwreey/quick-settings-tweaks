const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const Features = Me.imports.features
const { logger } = Me.imports.libs.utility
const { GLib } = imports.gi
var loaded

// handling extension
function enable() {
    logger("Loading ...")

    let settings = ExtensionUtils.getSettings(Me.metadata['settings-schema'])
    ExtensionUtils.initTranslations()

    // load features
    loaded = [
        new Features.dndQuickToggle.dndQuickToggleFeature(settings),
        new Features.notifications.notificationsFeature(settings),
        new Features.volumeMixer.volumeMixerFeature(settings),
        new Features.dateMenu.dateMenuFeature(settings),
        new Features.buttonRemover.buttonRemoverFeature(settings)
    ]

    this.timeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 300, () => {
        for (const feature of loaded) {
            logger(`Loading feature '${feature.constructor.name}'`)
            feature.load()
        }
        logger("Loaded")
        return GLib.SOURCE_REMOVE;
    });
}

function disable() {
    logger("Unloading ...")

    if (this.timeout) {
        GLib.Source.remove(this.timeout)
        this.timeout = null
    }
    if (!loaded) return
    for (const feature of loaded) {
        logger(`Unload feature '${feature.constructor.name}'`)
        feature.unload()
    }
    loaded = null

    logger("Diabled")
}
