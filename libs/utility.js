
// This is a bit of a hack, but it works for now. I took this from the
// gjs guide on how to position items above the background apps menu.
function addQuickSettingsItems(items) {
    // Add the items with the built-in function
    QuickSettings._addItems(items)

    // Ensure the tile(s) are above the background apps menu
    if (QuickSettings._backgroundApps) {
        for (const item of items) {
            QuickSettingsGrid.set_child_below_sibling(
                item,
                QuickSettings._backgroundApps.quickSettingsItems[0]
            )
        }
    }
}

function logger(str) {
    log("[EXTENSION QSTweaks] " + str)
}

var featureReloader = {
    // Enable feature reloader with specific setting keys
    enableWithSettingKeys(feature,settingKeys) {
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
    },
    
    // Disable feature reloader
    disable(feature) {
        if (!feature.settingsListeners) return
        for (const connection of feature.settingsListeners) {
            feature.settings.disconnect(connection)
        }
        feature.settingsListeners = null
    }
}
