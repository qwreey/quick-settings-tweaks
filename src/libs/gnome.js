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

import * as Main from "resource:///org/gnome/shell/ui/main.js"

// Quick Settings
export const QuickSettings = Main.panel.statusArea.quickSettings
export const QuickSettingsMenu = QuickSettings.menu
export const QuickSettingsGrid = QuickSettings.menu._grid
export const QuickSettingsBox =  QuickSettings.menu.box
export const QuickSettingsActor = QuickSettings.menu.actor
export const GetQuickSettingsShutdownMenuBox = ()=>{
    return new Promise(resolve=>{
        GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
            if (!QuickSettings._system)
                return GLib.SOURCE_CONTINUE
            resolve(QuickSettings._system._systemItem.menu.box)
            return GLib.SOURCE_REMOVE
        });
    })
}


// Quick Settings Items
export const InputStreamSlider = QuickSettings._volumeInput._input
export const OutputStreamSlider = QuickSettings._volumeOutput._output

// Date Menu
export const DateMenu = Main.panel.statusArea.dateMenu
export const DateMenuBox = DateMenu.menu.box
export const DateMenuHolder = DateMenu.menu.box.first_child.first_child
export const DateMenuNotifications =
    DateMenuHolder.get_children()
    .find(item=>item.constructor.name=="CalendarMessageList")
export const DateMenuMediaControl = DateMenuNotifications
    .last_child.first_child.last_child.first_child
