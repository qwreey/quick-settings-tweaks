
const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

var pageList = [
    Me.imports.prefPages.volumeMixer.volumeMixerPage,
    Me.imports.prefPages.inputOutput.inputOutputPage,
    Me.imports.prefPages.notifications.notificationsPage,
    Me.imports.prefPages.mediaControl.mediaControlPage,
    Me.imports.prefPages.quickToggles.quickTogglesPage,
    Me.imports.prefPages.other.otherPage,
    Me.imports.prefPages.about.aboutPage
]

function fillPreferencesWindow(window) {
    let settings = ExtensionUtils.getSettings(Me.metadata['settings-schema'])
    
    for (const page of pageList) {
        window.add(new page(settings))
    }
}

function init() {
}
