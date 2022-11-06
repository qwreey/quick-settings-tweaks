// Enable feature reloader with specific setting keys
function enableWithSettingKeys(feature,settingKeys) {
    // save connections here and destroy when disable called
    let settingsListeners = feature.settingsListeners
    if (!settingsListeners) {
        settingsListeners = []
        feature.settingsListeners = settingsListeners
    }

    const reload = ()=>{
        feature.unload()
        feature.load()
    }

    for (const key of settingKeys) {
        settingsListeners.push(feature.settings.connect("changed::"+key,reload))
    }
}

// Disable feature reloader
function disable(feature) {
    if (!feature.settingsListeners) return
    for (const connection of feature.settingsListeners) {
        feature.settings.disconnect(connection)
    }
    feature.settingsListeners = null
}
