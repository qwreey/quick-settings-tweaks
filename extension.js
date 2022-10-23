const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const { VolumeMixerPopupMenu } = Me.imports.volumeMixerPopupMenu
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main
const Grid = Main.panel.statusArea.quickSettings.menu._grid
const inputSliderName = "InputStreamSlider"

var volumeMixer = null

function enable() {
    volumeMixer = new VolumeMixerPopupMenu()
    // Main.panel.statusArea.quickSettings.menu.addMenuItem
    // Main._test = volumeMixer
    // let menu = new PopupMenu.PopupMenuSection()
    // imports.ui.main.panel.statusArea.quickSettings.menu.box.add_child(menu.actor) 
    // menu.addMenuItem(volumeMixer)
    // menu.actor.add_child(volumeMixer.actor)

    function log(e) { if(!imports.ui.main._log){imports.ui.main._log=[]} imports.ui.main._log.push(e) }

    let inputSliderIndex
    let gridChildren = Grid.get_children()
    for (let index = 0; index<gridChildren.length; index++) {
        if (gridChildren[index]?.constructor?.name == inputSliderName) {
            inputSliderIndex = index
        }
    }

    if (inputSliderIndex) {
        let tmp = []
        for (let index = inputSliderIndex+1; index<gridChildren.length; index++) {
            let obj = gridChildren[index]
            tmp.push(obj)
            Grid.remove_child(obj)
        }
        Grid.add_child(volumeMixer.actor);
        for (let index = 0; index<tmp.length; index++) {
            Grid.add_child(tmp[index])
        }
    } else {
        Grid.add_child(volumeMixer.actor);
    }
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
