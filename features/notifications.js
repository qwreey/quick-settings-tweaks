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
            "enabled-features",
            "notifications-move-to-top",
            "notifications-dnd-switch",
            "notifications-integrated",
            "media-control-compact-mode",
        ])

        // check is feature enabled
        let notificationsEnabled = this.settings.get_boolean("notifications-enabled")
        let mediaControlEnabled = this.settings.get_boolean("media-control-enabled")
        if ( !notificationsEnabled && !mediaControlEnabled ) return

        // Make notification handler
        let isIntegrated = settings.get_boolean("notifications-integrated")
        this.notificationHandler = new Notifications()
        this.notificationHandler.style_class =
            (isIntegrated ? "" : "popup-menu-content quick-settings ")
            + (isIntegrated ? "QSTWEAKS-notifications-integrated " : "")
            + 'QSTWEAKS-notifications'

        // Insert media control
        if (mediaControlEnabled) {
            let mediaSection = this.notificationHandler.mediaSection
            mediaSection.style_class = "QSTWEAKS-media"
            QuickSettingsGrid.add_child(mediaSection)
            if (this.settings.get_boolean("media-control-compact-mode")) {
                mediaSection.style_class += " QSTWEAKS-media-compact-mode"
            }
            QuickSettingsGrid.layout_manager.child_set_property(
                QuickSettingsGrid, mediaSection, 'column-span', 2
            )
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
                    "QSTWEAKS-panel-menu "
                    + QuickSettingsActor.style_class

                this.gridBackupClass = QuickSettingsGrid.style_class
                QuickSettingsGrid.style_class =
                    QuickSettingsGrid.style_class
                    + " popup-menu-content quick-settings QSTWEAKS-quick-settings"

                // Move shutdown menu box to proper position
                let shutdownMenuHolder = QuickSettingsShutdownMenuBox.get_parent()
                if (shutdownMenuHolder) {
                    this.shutdownBackupClass = shutdownMenuHolder.style_class
                    shutdownMenuHolder.style_class =
                        "QSTWEAKS-quick-settings-shutdown-item "
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
