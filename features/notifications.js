const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const featureReloader = Me.imports.libs.featureReloader
const { Notifications } = Me.imports.libs.notificationHandler
const { addChildWithIndex } = Me.imports.libs.utility
const {
    QuickSettingsGrid,
    QuickSettingsBox,
    QuickSettingsActor,
    QuickSettingsShutdownMenuBox
} = Me.imports.libs.gnome

var notificationsFeature = class {
    constructor(settings) {
        this.settings = settings
    }

    load() {
        let settings = this.settings

        // setup reloader
        featureReloader.enableWithSettingKeys(this,[
            "notifications-enabled",
            "notifications-move-to-top",
            "notifications-integrated",
            "media-control-enabled",
            "media-control-compact-mode",
            "disable-adjust-content-border-radius",
            "notifications-use-native-controls",
            "notifications-hide-when-no-notifications"
        ])

        // check is feature enabled
        let notificationsEnabled = this.settings.get_boolean("notifications-enabled")
        let mediaControlEnabled = this.settings.get_boolean("media-control-enabled")
        let adjustBorder = this.settings.get_boolean("disable-adjust-content-border-radius")
        let nativeControls = this.settings.get_boolean("notifications-use-native-controls")
        if ( !notificationsEnabled && !mediaControlEnabled ) return

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
            + (adjustBorder ? "" : "QSTWEAKS-adjust-border-radius ")
            + "QSTWEAKS-notifications"
        this.notificationHandler.style
        = `max-height: ${this.settings.get_int("notifications-max-height")}px;`
        this.maxHeigthListen = this.settings.connect("changed::notifications-max-height",()=>{
            this.notificationHandler.style
            = `max-height: ${this.settings.get_int("notifications-max-height")}px;`
        })

        // Insert media control
        if (mediaControlEnabled) {
            let mediaSection = this.notificationHandler.mediaSection
            mediaSection.style_class = "QSTWEAKS-media"
            QuickSettingsGrid.add_child(mediaSection)
            if (this.settings.get_boolean("media-control-compact-mode")) {
                mediaSection.style_class += " QSTWEAKS-media-compact-mode"
            }
            if (!adjustBorder) {
                mediaSection.style_class += " QSTWEAKS-adjust-border-radius"
            }
            QuickSettingsGrid.layout_manager.child_set_property(
                QuickSettingsGrid, mediaSection, 'column-span', 2
            )
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
        if (notificationsEnabled) {
            if (this.settings.get_boolean("notifications-integrated")) {
                // get system item index
                let gridChildren = QuickSettingsGrid.get_children()
                let systemItemIndex = null
                for (let index = 0; index<gridChildren.length; index++) {
                    if (gridChildren[index]?.constructor?.name == "SystemItem") {
                        systemItemIndex = index
                    }
                }

                // Insert notification modal
                if (this.settings.get_boolean("notifications-move-to-top") && (systemItemIndex != null)) {
                    // insert on top
                    addChildWithIndex(QuickSettingsGrid,this.notificationHandler,systemItemIndex)
                } else {
                    QuickSettingsGrid.add_child(this.notificationHandler)
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
                let shutdownMenuHolder = QuickSettingsShutdownMenuBox.get_parent()
                if (shutdownMenuHolder) {
                    this.shutdownBackupClass = shutdownMenuHolder.style_class
                    shutdownMenuHolder.style_class =
                        "QSTWEAKS-quick-settings-separated-shutdown-item "
                        + shutdownMenuHolder.style_class
                }

                // Insert notification modal
                if (this.settings.get_boolean("notifications-move-to-top")) {
                    let quickSettingsModal = QuickSettingsBox.first_child
                    QuickSettingsBox.remove_child(quickSettingsModal)
                    QuickSettingsBox.add_child(this.notificationHandler)
                    QuickSettingsBox.add_child(quickSettingsModal)
                } else QuickSettingsBox.add_child(this.notificationHandler)
            }
        }
    }

    unload() {
        // disable feature reloader
        this.settings.disconnect(this.maxHeigthListen)
        featureReloader.disable(this)

        // destroy mediaControl/notifications
        this.notificationHandler.mediaSection.destroy()
        this.notificationHandler.destroy()
        this.notificationHandler = null

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
            QuickSettingsShutdownMenuBox.get_parent().style_class = this.shutdownBackupClass
            this.shutdownBackupClass = null
        }
    }
}
