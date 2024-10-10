import { featureReloader } from "../libs/utility.js"
import { NotificationBox } from "../components/notificationBox.js"
import { GnomeContext } from "../libs/gnome.js"

// FIXME: size change? issue when long noti showing
export class NotificationsFeature {
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

    readSettings() {
        let settings = this.settings

        // setup reloader
        featureReloader.enableWithSettingKeys(this, [
            "notifications-enabled",
            "notifications-position",
            "notifications-integrated",
            "media-control-enabled",
            "media-control-compact-mode",
            "disable-adjust-content-border-radius",
            "disable-remove-shadow",
            "notifications-use-native-controls",
            "notifications-hide-when-no-notifications"
        ])

        // check is feature enabled
        this.notificationsEnabled = this.settings.get_boolean("notifications-enabled")
        // this.mediaControlEnabled = this.settings.get_boolean("media-control-enabled")
        this.disableAdjustBorder = this.settings.get_boolean("disable-adjust-content-border-radius")
        this.disableRemoveShadow = this.settings.get_boolean("disable-remove-shadow")
        this.useNativeControls = this.settings.get_boolean("notifications-use-native-controls")
        this.autoHide = this.settings.get_boolean("notifications-hide-when-no-notifications")
        this.position = settings.get_string("notifications-position")
    }

    load() {
        this.readSettings()

        if (!this.notificationsEnabled) return

        this.notificationBox = new NotificationBox({
            autoHide: this.autoHide,
            useNativeControls: this.useNativeControls
        })

        let style = "QSTWEAKS-notifications QSTWEAKS-notifications-integrated"
        if (this.useNativeControls) style += " QSTWEAKS-notifications-use-native-controls"
        if (!this.disableAdjustBorder) style += " QSTWEAKS-adjust-border-radius"
        if (!this.disableRemoveShadow) style += " QSTWEAKS-remove-shadow"
        this.notificationBox.style_class = style

        // this.notificationBox.style_class =
        //     // If separated, style as popup menu
        //     (this.integrated ? "" : "popup-menu-content quick-settings ")
        //     // Integrated or separated
        //     + (this.integrated ? "QSTWEAKS-notifications-integrated " : "QSTWEAKS-notifications-separated ")
        //     // Is use native controls
        //     + (this.useNativeControls ? "QSTWEAKS-notifications-use-native-controls " : "")
        //     // adjust border radius of messages
        //     + (this.disableAdjustBorder ? "" : "QSTWEAKS-adjust-border-radius ")
        //     // remove shadows
        //     + (this.disableRemoveShadow ? "" : "QSTWEAKS-remove-shadow ")
        //     + "QSTWEAKS-notifications"

        // Max height
        this.notificationBox.style
            = `max-height: ${this.settings.get_int("notifications-max-height")}px`
        this.maxHeigthListen = this.settings.connect("changed::notifications-max-height", () => {
            this.notificationBox.style
                = `max-height: ${this.settings.get_int("notifications-max-height")}px`
        })

        // Insert Native DND Switch
        // FIXME: strange size
        const nativeControl = this.notificationBox._nativeControl
        if (nativeControl) {
            nativeControl._clearButton.style_class
                += " QSTWEAKS-notifications-native-clear-button"
            nativeControl._dndSwitch.style_class
                += " QSTWEAKS-notifications-native-dnd-switch"
            // nativeControl.nativeDndText.style_class
            //     += " QSTWEAKS-notifications-native-dnd-text"
            nativeControl.style_class
                = " QSTWEAKS-notifications-native-control-box"
        }

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

    unload() {
        featureReloader.disable(this)

        // disable feature reloader
        if (this.maxHeigthListen) this.settings.disconnect(this.maxHeigthListen)
        this.maxHeigthListen = null

        // destroy mediaControl/notifications
        if (this.notificationBox) {
            this.notificationBox.destroy()
        }
        this.notificationBox = null
    }
}
