import { featureReloader } from "../libs/utility.js"
import { Notifications } from "../libs/notificationHandler.js"
import {
    QuickSettingsMenu,
    QuickSettingsGrid,
    QuickSettingsBox,
    QuickSettingsActor,
    GetQuickSettingsShutdownMenuBox
} from "../libs/gnome.js"

export class NotificationsFeature {
    onMenuOpen() {
        // reorder on menu open
        if (this.mediaControlEnabled) {
            QuickSettingsMenu._grid.set_child_at_index(
                this.notificationHandler.mediaSection,
                -1
            )
        }
        if (this.notificationsEnabled && this.notificationsIntegrated) {
            QuickSettingsMenu._grid.set_child_above_sibling(
                this.notificationHandler,
                this.notificationsPosition === "top" ? SystemItem : null
            )
        }
    }

    load() {
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
        let notificationsEnabled = this.notificationsEnabled = this.settings.get_boolean("notifications-enabled")
        let mediaControlEnabled = this.mediaControlEnabled = this.settings.get_boolean("media-control-enabled")
        let disableAdjustBorder = this.settings.get_boolean("disable-adjust-content-border-radius")
        let disableRemoveShadow = this.settings.get_boolean("disable-remove-shadow")
        let nativeControls = this.settings.get_boolean("notifications-use-native-controls")
        if (!notificationsEnabled && !mediaControlEnabled) return

        // Make notification handler
        let isIntegrated = settings.get_boolean("notifications-integrated")
        this.notificationHandler = new Notifications({
            useNativeControls: nativeControls,
            hideWhenNoNotifications: this.settings.get_boolean("notifications-hide-when-no-notifications")
        })

        this.notificationHandler.style_class =
            // If separated, style as popup menu
            (isIntegrated ? "" : "popup-menu-content quick-settings ")
            // Integrated or separated
            + (isIntegrated ? "QSTWEAKS-notifications-integrated " : "QSTWEAKS-notifications-separated ")
            // Is use native controls
            + (nativeControls ? "QSTWEAKS-notifications-use-native-controls " : "")
            // adjust border radius of messages
            + (disableAdjustBorder ? "" : "QSTWEAKS-adjust-border-radius ")
            // remove shadows
            + (disableRemoveShadow ? "" : "QSTWEAKS-remove-shadow ")
            + "QSTWEAKS-notifications"

        // Max height
        this.notificationHandler.style
            = `max-height: ${this.settings.get_int("notifications-max-height")}px`
        this.maxHeigthListen = this.settings.connect("changed::notifications-max-height", () => {
            this.notificationHandler.style
                = `max-height: ${this.settings.get_int("notifications-max-height")}px`
        })

        // Insert media control
        if (mediaControlEnabled) {
            let mediaSection = this.notificationHandler.mediaSection
            mediaSection.style_class = "QSTWEAKS-media"
            QuickSettingsMenu.addItem(mediaSection, 2);
            if (this.settings.get_boolean("media-control-compact-mode")) {
                mediaSection.style_class += " QSTWEAKS-media-compact-mode"
            }
            if (!disableAdjustBorder) {
                mediaSection.style_class += " QSTWEAKS-adjust-border-radius"
            }
            if (!disableRemoveShadow) {
                mediaSection.style_class += " QSTWEAKS-remove-shadow"
            }
        }

        // Insert Native DND Switch
        if (nativeControls && notificationsEnabled) {
            this.notificationHandler.nativeClearButton.style_class
                += " QSTWEAKS-notifications-native-clear-button"
            this.notificationHandler.nativeDndSwitch.style_class
                += " QSTWEAKS-notifications-native-dnd-switch"
            this.notificationHandler.nativeDndText.style_class
                += " QSTWEAKS-notifications-native-dnd-text"
            this.notificationHandler.nativeControlBox.style_class
                = " QSTWEAKS-notifications-native-control-box"
        }

        // Insert notifications
        let notificationsPosition = this.notificationsPosition = this.settings.get_string("notifications-position")
        let notificationsIntegrated = this.notificationsIntegrated = this.settings.get_string("notifications-position")
        if (notificationsEnabled) {
            if (notificationsIntegrated) {
                // Insert notification modal
                switch (notificationsPosition) {
                    case "top":
                        QuickSettingsGrid.insert_child_at_index(this.notificationHandler,
                            // get system item index
                            QuickSettingsGrid.get_children().findIndex((child) => child.constructor?.name == "SystemItem") + 1
                        )
                        break
                    case "bottom":
                        QuickSettingsGrid.add_child(this.notificationHandler)
                        break
                }
                QuickSettingsGrid.layout_manager.child_set_property(
                    QuickSettingsGrid, this.notificationHandler, 'column-span', 2
                )
            } else { // separated mode
                // Restyle Box/Actor/Grid
                this.boxBackupClass = QuickSettingsBox.style_class
                QuickSettingsBox.style_class = ""

                this.actorBackupClass = QuickSettingsActor.style_class
                QuickSettingsActor.style_class =
                    "QSTWEAKS-panel-menu-separated "
                    + QuickSettingsActor.style_class

                this.gridBackupClass = QuickSettingsGrid.style_class
                QuickSettingsGrid.style_class =
                    QuickSettingsGrid.style_class
                    + " popup-menu-content quick-settings QSTWEAKS-quick-settings-separated"

                // Move shutdown menu box to proper position
                GetQuickSettingsShutdownMenuBox().then((shutdownMenuHolder)=>{
                    shutdownMenuHolder = shutdownMenuHolder?.get_parent()
                    if (!shutdownMenuHolder) return

                    this.shutdownBackupClass = shutdownMenuHolder.style_class
                    shutdownMenuHolder.style_class =
                        "QSTWEAKS-quick-settings-separated-shutdown-item "
                        + shutdownMenuHolder.style_class
                })

                // Insert notification modal
                switch (notificationsPosition) {
                    case "top":
                        let quickSettingsModal = QuickSettingsBox.first_child
                        QuickSettingsBox.remove_child(quickSettingsModal)
                        QuickSettingsBox.add_child(this.notificationHandler)
                        QuickSettingsBox.add_child(quickSettingsModal)
                        break
                    case "bottom":
                        QuickSettingsBox.add_child(this.notificationHandler)
                        break
                }
            }
        }
    }

    unload() {
        // disable feature reloader
        if (this.maxHeigthListen) this.settings.disconnect(this.maxHeigthListen)
        featureReloader.disable(this)

        // destroy mediaControl/notifications
        if (this.notificationHandler) {
            this.notificationHandler.mediaSection.destroy()
            this.notificationHandler.destroy()
            this.notificationHandler = null
        }

        // restore style
        if (this.boxBackupClass) {
            QuickSettingsBox.style_class = this.boxBackupClass
            this.boxBackupClass = null
        }
        if (this.actorBackupClass) {
            QuickSettingsActor.style_class = this.actorBackupClass
            this.actorBackupClass = null
        }
        if (this.gridBackupClass) {
            QuickSettingsGrid.style_class = this.gridBackupClass
            this.gridBackupClass = null
        }
        if (this.shutdownBackupClass) {
            GetQuickSettingsShutdownMenuBox().then((shutdownMenuHolder)=>{
                shutdownMenuHolder.get_parent().style_class = this.shutdownBackupClass
            })
            this.shutdownBackupClass = null
        }
    }
}
