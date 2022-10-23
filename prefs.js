const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const { VolumeMixerPrefsPage } = Me.imports.volumeMixerPrefsPage

function init() {
}

function fillPreferencesWindow(window) {
    window.add(new VolumeMixerPrefsPage())
}
