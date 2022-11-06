const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const Features = Me.imports.features
const { logging } = Me.imports.libs.utility
var loaded

// handling extension
function enable() {
    logging("Enabled")

    let settings = ExtensionUtils.getSettings(Me.metadata['settings-schema'])
    imports.ui.main.settings = settings

    // load features
    loaded = [
        new Features.dndQuickToggle.dndQuickToggleFeature(settings),
        new Features.buttonRemover.buttonRemoverFeature(settings),
        new Features.notifications.notificationsFeature(settings),
        new Features.volumeMixer.volumeMixerFeature(settings),
        new Features.dateMenu.dateMenuFeature(settings)
    ]
    for (const feature of loaded) feature.load()

    logging("Loaded")
}

function disable() {
    logging("Unloading ...")

    if (!loaded) return
    for (const feature of loaded) feature.unload()
    loaded = null

    logging("Diabled")
}
