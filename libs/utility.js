// Fix https://github.com/qwreey75/quick-settings-tweaks/issues/19
// scrollbar appears over fading-effect
export function fixStScrollViewScrollbarOverflow(stScrollView) {
    let update = ()=>stScrollView.overlay_scrollbars = !stScrollView.vscrollbar_visible
    stScrollView.connect("notify::vscrollbar-visible",update)
    update()
}

export function logger(str) {
    console.log("[EXTENSION QSTweaks] " + str)
}

export const featureReloader = {
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
