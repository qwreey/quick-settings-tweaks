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

const Main = imports.ui.main

// Quick Settings
var QuickSettings = Main.panel.statusArea.quickSettings
var QuickSettingsGrid = QuickSettings.menu._grid
var QuickSettingsBox = QuickSettings.menu.box
var QuickSettingsActor = QuickSettings.menu.actor

// Quick Settings Items
var SystemItem = QuickSettings._system._systemItem;
var InputStreamSlider = QuickSettings._volume._input;
var OutputStreamSlider = QuickSettings._volume._output;

var QuickSettingsShutdownMenuBox =
    SystemItem
        .first_child?.get_children()?.find(i => i.constructor?.name == "ShutdownItem")
        ?.menu?.box

// Date Menu
var DateMenu = Main.panel.statusArea.dateMenu
var DateMenuBox = DateMenu.menu.box
var DateMenuHolder = DateMenu.menu.box.first_child.first_child
var DateMenuNotifications =
    DateMenuHolder.get_children()
        .find(item => item.constructor.name == "CalendarMessageList")
var DateMenuMediaControl = DateMenuNotifications
    .last_child.first_child.last_child.first_child
