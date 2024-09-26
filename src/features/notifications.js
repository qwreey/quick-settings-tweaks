import { featureReloader } from "../libs/utility.js"
import { NotificationBox } from "../libs/notificationBox.js"
import { GnomeContext } from "../libs/gnome.js"

// FIXME: size change? issue when long noti showing
export class NotificationsFeature {
    onMenuOpen() {
        // reorder on menu open
        if (this.mediaControlEnabled) {
            GnomeContext.QuickSettingsMenu._grid.set_child_at_index(
                this.notificationHandler.mediaSection,
                -1
            )
        }
        if (this.notificationsEnabled && this.notificationsIntegrated) {
            GnomeContext.QuickSettingsMenu._grid.set_child_above_sibling(
                this.notificationHandler,
                this.notificationsPosition === "top" ? SystemItem : null
            )
        }
    }

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
        this.integrated = settings.get_boolean("notifications-integrated")
        this.position = settings.get_string("notifications-position")
    }

    load() {
        this.readSettings()

        if (!this.notificationsEnabled) return

        this.notificationBox = new NotificationBox({
            autoHide: this.autoHide,
            useNativeControls: this.useNativeControls
        })


        // Make notification handler
        // let isIntegrated = 
        // this.notificationHandler = new Notifications({
        //     useNativeControls: nativeControls,
        //     hideWhenNoNotifications: this.settings.get_boolean("notifications-hide-when-no-notifications")
        // })
        this.notificationBox.style_class =
            // If separated, style as popup menu
            (this.integrated ? "" : "popup-menu-content quick-settings ")
            // Integrated or separated
            + (this.integrated ? "QSTWEAKS-notifications-integrated " : "QSTWEAKS-notifications-separated ")
            // Is use native controls
            + (this.useNativeControls ? "QSTWEAKS-notifications-use-native-controls " : "")
            // adjust border radius of messages
            + (this.disableAdjustBorder ? "" : "QSTWEAKS-adjust-border-radius ")
            // remove shadows
            + (this.disableRemoveShadow ? "" : "QSTWEAKS-remove-shadow ")
            + "QSTWEAKS-notifications"

        // Max height
        this.notificationBox.style
            = `max-height: ${this.settings.get_int("notifications-max-height")}px`
        this.maxHeigthListen = this.settings.connect("changed::notifications-max-height", () => {
            this.notificationBox.style
                = `max-height: ${this.settings.get_int("notifications-max-height")}px`
        })

        // Insert media control
        // if (mediaControlEnabled) {
        //     let mediaSection = this.notificationHandler.mediaSection
        //     mediaSection.style_class = "QSTWEAKS-media"
        //     GnomeContext.QuickSettingsMenu.addItem(mediaSection, 2);
        //     if (this.settings.get_boolean("media-control-compact-mode")) {
        //         mediaSection.style_class += " QSTWEAKS-media-compact-mode"
        //     }
        //     if (!disableAdjustBorder) {
        //         mediaSection.style_class += " QSTWEAKS-adjust-border-radius"
        //     }
        //     if (!disableRemoveShadow) {
        //         mediaSection.style_class += " QSTWEAKS-remove-shadow"
        //     }
        // }

        // Insert Native DND Switch
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

        // Insert notifications
        // let notificationsPosition = this.notificationsPosition = this.settings.get_string("notifications-position")
        // let notificationsIntegrated = this.notificationsIntegrated = this.settings.get_string("notifications-position")
        // if (notificationsEnabled) {
        //     if (notificationsIntegrated) {
        //         // Insert notification modal
        //         switch (notificationsPosition) {
        //             case "top":
        //                 GnomeContext.QuickSettingsGrid.insert_child_at_index(this.notificationHandler,
        //                     // get system item index
        //                     GnomeContext.QuickSettingsGrid.get_children().findIndex((child) => child.constructor?.name == "SystemItem") + 1
        //                 )
        //                 break
        //             case "bottom":
        //                 GnomeContext.QuickSettingsGrid.add_child(this.notificationHandler)
        //                 break
        //         }
        //         GnomeContext.QuickSettingsGrid.layout_manager.child_set_property(
        //             GnomeContext.QuickSettingsGrid, this.notificationHandler, 'column-span', 2
        //         )
        //     } else { // separated mode
        //         // Restyle Box/Actor/Grid
        //         this.boxBackupClass = QuickSettingsBox.style_class
        //         QuickSettingsBox.style_class = ""

        //         this.actorBackupClass = QuickSettingsActor.style_class
        //         QuickSettingsActor.style_class =
        //             "QSTWEAKS-panel-menu-separated "
        //             + QuickSettingsActor.style_class

        //         this.gridBackupClass = GnomeContext.QuickSettingsGrid.style_class
        //         GnomeContext.QuickSettingsGrid.style_class =
        //             GnomeContext.QuickSettingsGrid.style_class
        //             + " popup-menu-content quick-settings QSTWEAKS-quick-settings-separated"

        //         // Move shutdown menu box to proper position
        //         GetQuickSettingsShutdownMenuBox().then((shutdownMenuHolder)=>{
        //             shutdownMenuHolder = shutdownMenuHolder?.get_parent()
        //             if (!shutdownMenuHolder) return

        //             this.shutdownBackupClass = shutdownMenuHolder.style_class
        //             shutdownMenuHolder.style_class =
        //                 "QSTWEAKS-quick-settings-separated-shutdown-item "
        //                 + shutdownMenuHolder.style_class
        //         })

        //         // Insert notification modal
        //         switch (notificationsPosition) {
        //             case "top":
        //                 let quickSettingsModal = QuickSettingsBox.first_child
        //                 QuickSettingsBox.remove_child(quickSettingsModal)
        //                 QuickSettingsBox.add_child(this.notificationHandler)
        //                 QuickSettingsBox.add_child(quickSettingsModal)
        //                 break
        //             case "bottom":
        //                 QuickSettingsBox.add_child(this.notificationHandler)
        //                 break
        //         }
        //     }
        // }
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

        // restore style
        // if (this.boxBackupClass) {
        //     QuickSettingsBox.style_class = this.boxBackupClass
        //     this.boxBackupClass = null
        // }
        // if (this.actorBackupClass) {
        //     QuickSettingsActor.style_class = this.actorBackupClass
        //     this.actorBackupClass = null
        // }
        // if (this.gridBackupClass) {
        //     GnomeContext.QuickSettingsGrid.style_class = this.gridBackupClass
        //     this.gridBackupClass = null
        // }
        // if (this.shutdownBackupClass) {
        //     GetQuickSettingsShutdownMenuBox().then((shutdownMenuHolder)=>{
        //         shutdownMenuHolder.get_parent().style_class = this.shutdownBackupClass
        //     })
        //     this.shutdownBackupClass = null
        // }
    }
}
