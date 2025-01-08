import { NotificationBox } from "../components/notificationBox.js"
import { GnomeContext } from "../libs/gnome.js"
import { FeatureBase, SettingLoader } from "../libs/feature.js"

// FIXME: size change? issue when long noti showing
export class NotificationsFeature extends FeatureBase {
    // #region settings
    notificationsEnabled: boolean
    useNativeControls: boolean
    autoHide: boolean
    position: string
    maxHeight: number
    compact: boolean
    override loadSettings(loader: SettingLoader): void {
        this.notificationsEnabled = loader.loadBoolean("notifications-enabled")
        this.useNativeControls = loader.loadBoolean("notifications-use-native-controls")
        this.autoHide = loader.loadBoolean("notifications-hide-when-no-notifications")
        this.position = loader.loadString("notifications-position")
        this.maxHeight = loader.loadInt("notifications-max-height")
        this.compact = loader.loadBoolean("notifications-compact")
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
    updateStyleClass() {
        let style = "QSTWEAKS-notifications"
        if (this.useNativeControls) style += " QSTWEAKS-use-native-controls"
        if (this.compact) style += " QSTWEAKS-message-compact"
        this.notificationBox.style_class = style
    }

    override reload(key: string): void {
        switch (key) {
            case "notifications-max-height":
                this.updateMaxHeight()
                break
            case "notifications-compact":
                this.updateStyleClass()
                break
            default:
                super.reload()
                break
        }
    }
    override onLoad(): void {
        if (!this.notificationsEnabled) return

        // Create Notification Box
        this.maid.destroyJob(
            this.notificationBox = new NotificationBox({
                autoHide: this.autoHide,
                useNativeControls: this.useNativeControls
            })
        )

        // Update styles
        this.updateStyleClass()
        this.updateMaxHeight()

        // add
        // FIXME: with layout manager
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
    override onUnload(): void {
        this.notificationBox = null
    }
}
