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
export var QuickSettings = Main.panel.statusArea.quickSettings
export var QuickSettingsGrid = QuickSettings.menu._grid
export var QuickSettingsBox =  QuickSettings.menu.box
export var QuickSettingsActor = QuickSettings.menu.actor
export var QuickSettingsShutdownMenuBox =
    QuickSettingsBox.first_child
    ?.get_children()?.find(i=>i.constructor?.name=="SystemItem")
    ?.first_child?.get_children()?.find(i=>i.constructor?.name=="ShutdownItem")
    ?.menu?.box

// Date Menu
export var DateMenu = Main.panel.statusArea.dateMenu
export var DateMenuBox = DateMenu.menu.box
export var DateMenuHolder = DateMenu.menu.box.first_child.first_child
export var DateMenuNotifications =
    DateMenuHolder.get_children()
    .find(item=>item.constructor.name=="CalendarMessageList")
export var DateMenuMediaControl = DateMenuNotifications
    .last_child.first_child.last_child.first_child
