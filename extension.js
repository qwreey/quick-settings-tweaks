const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const Libs = Me.imports.libs
const Features = Me.imports.features

// handling extension
var ExtensionGlobal
function enable() {
    // provide widely used things
    ExtensionGlobal = {
        settings: ExtensionUtils.getSettings(Me.metadata['settings-schema']),

        // libs
        gnome: Libs.gnome,
        lang: Libs.lang,
        featureReloader: Libs.featureReloader,
        libs: Libs
    }

    // load features
    let featureList = [
        new Features.notifications.notificationsFeature(ExtensionGlobal),
        new Features.buttonRemover.buttonRemoverFeature(ExtensionGlobal),
        new Features.volumeMixer.volumeMixerFeature(ExtensionGlobal)
    ]
    for (const feature of featureList) feature.load()
    ExtensionGlobal.loaded = featureList
}

function disable() {
    if (!ExtensionGlobal) return
    for (const feature of ExtensionGlobal.loaded) {
        feature.unload()
    }
}
