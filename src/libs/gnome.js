// This module exports gnome's UI objects
// For make codes simple, All the gnome objects should be getting in here
// You can import gnome object like this
// * gnome object means UI that made by gnome 
//
// const {
//    QuickSettingsGrid,
//    QuickSettingsBox
// } = Me.imports.gnome
//

import GLib from "gi://GLib"
import * as Main from "resource:///org/gnome/shell/ui/main.js"

export const GnomeContext = new (class GnomeContext {
    constructor() {
    }
    uninit() {
        this.QuickSettings = null
        this.QuickSettingsMenu = null
        this.QuickSettingsGrid = null
        this.QuickSettingsBox = null
        this.QuickSettingsActor = null
        this.GetQuickSettingsShutdownMenuBox = null
        this.DateMenu = null
        this.DateMenuBox = null
        this.DateMenuHolder = null
        this.DateMenuNotifications = null
        this.DateMenuMediaControl = null
    }
    init() {
        // Quick Settings Items
        const QuickSettings = this.QuickSettings = Main.panel.statusArea.quickSettings
        this.QuickSettingsMenu = QuickSettings.menu
        this.QuickSettingsGrid = QuickSettings.menu._grid
        this.QuickSettingsBox =  QuickSettings.menu.box
        this.QuickSettingsActor = QuickSettings.menu.actor
        this.GetQuickSettingsShutdownMenuBox = (callback)=>{
            // To prevent freeze, priority should be PRIORITY_DEFAULT_IDLE instead of PRIORITY_DEFAULT
            GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                if (!QuickSettings._system)
                    return GLib.SOURCE_CONTINUE
                callback(QuickSettings._system._systemItem.menu.box)
                return GLib.SOURCE_REMOVE
            })
        }

        // Date Menu
        const DateMenu = this.DateMenu = Main.panel.statusArea.dateMenu
        this.DateMenuBox = DateMenu.menu.box
        this.DateMenuHolder = DateMenu.menu.box.first_child.first_child
        this.DateMenuNotifications =
            this.DateMenuHolder.get_children()
            .find(item=>item.constructor.name=="CalendarMessageList")
        this.DateMenuMediaControl = this.DateMenuNotifications
            .last_child.first_child.last_child.first_child

        // Message
        this.MessageTray = Main.messageTray

        function StreamSliderGetter() {
            if (!QuickSettings._volumeInput)
                return null
            return {
                VolumeInput: QuickSettings._volumeInput,
                InputStreamSlider: QuickSettings._volumeInput._input,
                OutputStreamSlider: QuickSettings._volumeOutput._output,
            }
        }
        this.GetStreamSlider = (callback)=>{
            let streamSlider = StreamSliderGetter()
            if (streamSlider) {
                callback(streamSlider)
                return
            }
        
            GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, ()=>{
                streamSlider = StreamSliderGetter()
        
                if (!streamSlider) return GLib.SOURCE_CONTINUE
        
                callback(streamSlider)
                return GLib.SOURCE_REMOVE
            })
        }
    }
})()

