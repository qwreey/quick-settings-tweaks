import { featureReloader } from "../libs/utility.js"
import { NotificationBox } from "../components/notificationBox.js"
import { GnomeContext } from "../libs/gnome.js"
import { FeatureBase, SettingLoader } from "../libs/feature.js"

// FIXME: size change? issue when long noti showing
export class NotificationsFeature extends FeatureBase {

    // #region settings
    notificationsEnabled: boolean
    disableAdjustBorder: boolean
    disableRemoveShadow: boolean
    useNativeControls: boolean
    autoHide: boolean
    position: string
    maxHeight: number
    loadSettings(loader: SettingLoader): void {
        this.notificationsEnabled = loader.loadBoolean("notifications-enabled")
        this.disableAdjustBorder = loader.loadBoolean("disable-adjust-content-border-radius")
        this.disableRemoveShadow = loader.loadBoolean("disable-remove-shadow")
        this.useNativeControls = loader.loadBoolean("notifications-use-native-controls")
        this.autoHide = loader.loadBoolean("notifications-hide-when-no-notifications")
        this.position = loader.loadString("notifications-position")
        this.maxHeight = loader.loadInt("notifications-max-height")
    }
    // #endregion settings

    // onMenuOpen() {
    // // reorder on menu open
    // if (this.mediaControlEnabled) {
    //     GnomeContext.QuickSettingsMenu._grid.set_child_at_index(
    //         this.notificationHandler.mediaSection,
    //         -1
    //     )
    // }
    // if (this.notificationsEnabled) {
    //     GnomeContext.QuickSettingsMenu._grid.set_child_above_sibling(
    //         this.notificationHandler,
    //         this.notificationsPosition === "top" ? SystemItem : null
    //     )
    // }
    // }
    notificationBox: NotificationBox

    updateMaxHeight() {
        this.notificationBox.style = `max-height: ${this.maxHeight}`
    }

    reload(key: string) {
        if (key == "notifications-max-height") {
            this.updateMaxHeight()
            return
        }
        this.hotReload()
    }
    onLoad() {
        if (!this.notificationsEnabled) return

        this.maid.destroyJob(
            this.notificationBox = new NotificationBox({
                autoHide: this.autoHide,
                useNativeControls: this.useNativeControls
            })
        )

        let style = "QSTWEAKS-notifications"
        if (this.useNativeControls) style += " QSTWEAKS-use-native-controls"
        if (!this.disableAdjustBorder) style += " QSTWEAKS-adjust-border-radius"
        if (!this.disableRemoveShadow) style += " QSTWEAKS-remove-shadow"
        this.notificationBox.style_class = style
        this.updateMaxHeight()

        // add
        switch (this.position) {
            case "top":
                GnomeContext.QuickSettingsGrid.insert_child_at_index(this.notificationBox,
                    // get system item index
                    GnomeContext.QuickSettingsGrid.get_children().findIndex((child) => child.constructor?.name == "SystemItem") + 1
                )
                break
            case "bottom":
                GnomeContext.QuickSettingsGrid.add_child(this.notificationBox)
                break
        }
        GnomeContext.QuickSettingsGrid.layout_manager.child_set_property(
            GnomeContext.QuickSettingsGrid, this.notificationBox, 'column-span', 2
        )
    }
    onUnload() {
        this.notificationBox = null
    }
}
