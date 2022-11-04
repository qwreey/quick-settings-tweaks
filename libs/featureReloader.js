
function checkFeatureEnabled(featureName) {
    return this.settings
        .get_strv("enabled-features")
        .includes(featureName)
}

// Enable feature reloader with specific setting keys
function enableWithSettingKeys(feature,settingKeys) {
    // save connections here and destroy when disable called
    let settingsListener = feature.settingsListener
    if (!settingsListener) {
        settingsListener = []
        feature.settingsListener = settingsListener
    }

    const reload = ()=>{
        feature.unload()
        feature.load()
    }

    for (const key of settingKeys) {
        settingsListener.push(feature.settings.connect("changed::"+key,reload))
    }
}

// Disable feature reloader
function disable(feature) {
    if (!feature.settingsListener) return
    for (const connection of feature.settingsListener) {
        feature.settings.disconnect(connection)
    }
    feature.settingsListener = null
}
