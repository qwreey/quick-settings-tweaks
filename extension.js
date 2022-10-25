const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main
const Grid = Main.panel.statusArea.quickSettings.menu._grid
const QuickSettings = Main.panel.statusArea.quickSettings
const InputSliderName = "InputStreamSlider"

const { VolumeMixer } = Me.imports.volumeMixer
const { Notifications } = Me.imports.notifications

class ExtensionClass {
    constructor(enabledFeatures) {
        if (enabledFeatures.includes("volumeMixer")) {
            this.volumeMixer = new VolumeMixer()
        }
        if (enabledFeatures.includes("notifications")) {
            this.notifications = new Notifications()
        }
    }
    enable() {
        // enable notifications
        if (this.notifications) {
            QuickSettings.menu.box.style_class = ""
            Grid.style_class = "popup-menu-content quick-settings " + Grid.style_class
            Grid.style = (Grid.style || "") + "margin-bottom: 12px !important;"
            QuickSettings.menu.box.add_child(this.notifications)
            Grid.add_child(this.notifications.mediaSection)
            Grid.layout_manager.child_set_property(
                Grid, this.notifications.mediaSection, 'column-span', 2
            )
        }
        
        // enable volumeMixer
        if (this.volumeMixer) {
            let inputSliderIndex
            let gridChildren = Grid.get_children()
            for (let index = 0; index<gridChildren.length; index++) {
                if (gridChildren[index]?.constructor?.name == InputSliderName) {
                    inputSliderIndex = index
                }
            }

            if (inputSliderIndex) {
                let tmp = []
                let tmp_visible = []
                for (let index = inputSliderIndex+1; index<gridChildren.length; index++) {
                    let obj = gridChildren[index]
                    tmp.push(obj)
                    tmp_visible.push(obj.visible)
                    Grid.remove_child(obj)
                }
                Grid.add_child(this.volumeMixer.actor);
                for (let index = 0; index<tmp.length; index++) {
                    let item = tmp[index]
                    Grid.add_child(item)
                    item.visible = tmp_visible[index]
                }
            } else {
                Grid.add_child(this.volumeMixer.actor);
            }
            Grid.layout_manager.child_set_property(
                Grid, this.volumeMixer.actor, 'column-span', 2
            )
        }
    }
    destroy() {
        // destroy notifications
        if (this.notifications) {
            this.notifications.destroy()
            this.notifications.mediaSection.destroy()
            this.notifications = null
        }

        // destroy volumeMixer 
        if (this.volumeMixer !== null) {
            this.volumeMixer.destroy()
            this.volumeMixer = null
        }
    }
}

// handling extension
var extension
function enable() {
    extension = new ExtensionClass(["volumeMixer","notifications"])
    extension.enable()
}
function disable() {
    extension.destroy()
    extension = null
}
