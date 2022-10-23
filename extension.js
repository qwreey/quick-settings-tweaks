const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const { VolumeMixerPopupMenu } = Me.imports.volumeMixerPopupMenu
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main
const Grid = Main.panel.statusArea.quickSettings.menu._grid

var volumeMixer = null

function enable() {
    volumeMixer = new VolumeMixerPopupMenu()
    // Main.panel.statusArea.quickSettings.menu.addMenuItem
    // Main._test = volumeMixer
    // let menu = new PopupMenu.PopupMenuSection()
    // imports.ui.main.panel.statusArea.quickSettings.menu.box.add_child(menu.actor) 
    // menu.addMenuItem(volumeMixer)
    // menu.actor.add_child(volumeMixer.actor)

    Grid.add_child(volumeMixer.actor);
    Grid.layout_manager.child_set_property(
        Grid, volumeMixer.actor, 'column-span', 2
    )
}

function disable() {
    // REMINDER: It's required for extensions to clean up after themselves when
    // they are disabled. This is required for approval during review!
    if (volumeMixer !== null) {
        volumeMixer.destroy()
        volumeMixer = null
    }
}
