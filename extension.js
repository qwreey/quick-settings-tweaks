const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const Libs = Me.imports.libs
const Features = Me.imports.features
var loaded

// handling extension
function enable() {
    let settings = ExtensionUtils.getSettings(Me.metadata['settings-schema'])

    // load features
    loaded = [
        new Features.notifications.notificationsFeature(settings),
        new Features.buttonRemover.buttonRemoverFeature(settings),
        new Features.volumeMixer.volumeMixerFeature(settings)
    ]
    for (const feature of loaded) feature.load()
}

function disable() {
    if (!loaded) return
    for (const feature of loaded) feature.unload()
    loaded = null
}
