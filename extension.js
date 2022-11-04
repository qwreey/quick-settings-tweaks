const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main
const Grid = Main.panel.statusArea.quickSettings.menu._grid
const QuickSettings = Main.panel.statusArea.quickSettings
const DateMenu = Main.panel.statusArea.dateMenu
const InputSliderName = "InputStreamSlider"
const DateMenuMessageList = "CalendarMessageList"

const { QuickTogglesManager } = Me.imports.quickTogglesManager
const { VolumeMixer } = Me.imports.volumeMixer
const { Notifications } = Me.imports.notifications

class ExtensionClass {
    constructor(settings) {
        this.enabledFeatures = settings.get_strv("enabled-features")
        this.settings = settings
    }

    // check feature has enabled
    isEnabled(featureName) {
        return this.enabledFeatures.includes(featureName)
    }

    // set enabled features, it cause reloading extension
    setEnabledFeatures(enabledFeatures) {
        this.enabledFeatures = enabledFeatures
        this.unload()
        this.load()
    }

    // init (create objects)
    init() {
        this.eventDisconnector = []
        if (this.isEnabled("volumeMixer")) {
            this.volumeMixer = new VolumeMixer()
        }
        if (this.isEnabled("notifications") || this.isEnabled("mediaControl")) {
            this.notifications = new Notifications({
                dndSwitch: this.settings.get_boolean("notifications-dnd-switch"),
                integrated: this.settings.get_boolean("notifications-integrated")
            })
        }
        this.quickTogglesManager = new QuickTogglesManager()
    }

    // reload when setting was changed
    settingListenKeys = [
        "notifications-move-to-top",
        "notifications-dnd-switch",
        "notifications-integrated",
        "datemenu-remove-notifications",
        "datemenu-fix-weather-widget",
        "media-control-compact-mode",
        "datemenu-remove-media-control",
        "volume-mixer-move-to-bottom",
        "volume-mixer-filtered-apps",
        "volume-mixer-show-description",
        "volume-mixer-show-icon",
        "volume-mixer-filter-mode"
    ]
    setupReloader() {
        // if enabled feature was changed, reload extension
        this.eventDisconnector.push([
            this.settings.disconnect.bind(this.settings),
            this.settings.connect("changed::enabled-features",()=>{
                this.setEnabledFeatures(this.settings.get_strv("enabled-features"))
            })
        ])

        for (const key of this.settingListenKeys) {
            this.eventDisconnector.push([
                this.settings.disconnect.bind(this.settings),
                this.settings.connect("changed::"+key,()=>{
                    this.unload(); this.load()
                })
            ])
        }
    }

    // load (add objects)
    load() {
        this.init()

        // enable quickTogglesManager
        this.quickTogglesManager.enable(Grid)

        // remove datemenu mediaControl/notifications
        this.dateMenuHolder = DateMenu.menu.box.first_child.first_child
        this.dateMenuNotifications =
            this.dateMenuHolder.get_children()
            .find(item=>item.constructor.name==DateMenuMessageList)
        if (this.settings.get_boolean("datemenu-remove-media-control")) {
            // this.dateMenuBoxBackupClass = DateMenu.menu.box.style_class;
            // DateMenu.menu.box.style_class = "qwreey-date-menu-remove-media-control " + DateMenu.menu.box.style_class

            this.dateMenuMediaControl = this.dateMenuNotifications
                .last_child.first_child.last_child.first_child
            this.dateMenuMediaControl.get_parent().remove_child(this.dateMenuMediaControl)
        }
        if (this.settings.get_boolean("datemenu-remove-notifications")) {
            this.dateMenuNotificationsRemoved = true
            this.dateMenuHolder.remove_child(this.dateMenuNotifications)
            DateMenu.menu.box.style = "padding: 4px 6px 4px 0px;"
        }
        
        // datemenu fix weather widget
        if (this.settings.get_boolean("datemenu-fix-weather-widget")) {
            this.weatherFixBackupClass = DateMenu.menu.box.style_class
            DateMenu.menu.box.style_class += " qwreey-fixed-weather"
        }

        // enable media control
        if (this.isEnabled("mediaControl")) {
            Grid.add_child(this.notifications.mediaSection)
            if (this.settings.get_boolean("media-control-compact-mode")) {
                this.notifications.mediaSection.style_class += " qwreey-media-compact-mode"
            }
            Grid.layout_manager.child_set_property(
                Grid, this.notifications.mediaSection, 'column-span', 2
            )
        }

        // enable notifications
        if (this.isEnabled("notifications")) {
            if (this.settings.get_boolean("notifications-integrated")) {
                Grid.add_child(this.notifications)
                Grid.layout_manager.child_set_property(
                    Grid, this.notifications, 'column-span', 2
                )
            } else {
                // separated
                let box = QuickSettings.menu.box
                let actor = QuickSettings.menu.actor
                let shutdownItem = box.first_child
                    ?.get_children()?.find(i=>i.constructor?.name=="SystemItem")
                    ?.first_child?.get_children()?.find(i=>i.constructor?.name=="ShutdownItem")
                    ?.menu?.box?.get_parent()
                this.qsBoxBackupClass = box.style_class
                this.qsActorBackupClass = actor.style_class
                this.gridBackupClass = Grid.style_class
                box.style_class = ""
                actor.style_class = "qwreey-panel-menu " + actor.style_class
                Grid.style_class = Grid.style_class + " popup-menu-content quick-settings qwreey-quick-settings"
                if (shutdownItem) {
                    this.qsShutdownItemBackupClass = shutdownItem.style_class
                    shutdownItem.style_class = "qwreey-quick-settings-shutdown-item " + shutdownItem.style_class
                }
                if (this.settings.get_boolean("notifications-move-to-top")) {
                    let quickSettingsModal = box.first_child
                    box.remove_child(quickSettingsModal)
                    box.add_child(this.notifications)
                    box.add_child(quickSettingsModal)
                } else box.add_child(this.notifications)
            }
        }

        // enable volumeMixer
        if (this.isEnabled("volumeMixer")) {
            let inputSliderIndex
            let gridChildren = Grid.get_children()
            for (let index = 0; index<gridChildren.length; index++) {
                if (gridChildren[index]?.constructor?.name == InputSliderName) {
                    inputSliderIndex = index
                }
            }

            if (inputSliderIndex && (!this.settings.get_boolean("volume-mixer-move-to-bottom"))) {
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

        this.setupReloader()
    }

    // unload (remove objects)
    unload() {
        // destroy notifications
        if (this.notifications) {
            this.notifications.destroy()
            this.notifications.mediaSection.destroy()
            this.notifications = null
        }
        if (this.qsBoxBackupClass) {
            let box = QuickSettings.menu.box
            box.style_class = this.qsBoxBackupClass
            this.qsBoxBackupClass = null
        }
        if (this.qsActorBackupClass) {
            let actor = QuickSettings.menu.actor
            actor.style_class = this.qsActorBackupClass
            this.qsActorBackupClass = null
        }

        // destroy volumeMixer 
        if (this.volumeMixer) {
            this.volumeMixer.destroy()
            this.volumeMixer = null
        }

        // destroy quickTogglesManager
        if (this.quickTogglesManager) {
            this.quickTogglesManager.destroy()
            this.quickTogglesManager = null
        }

        // restore date menu notifications
        if (this.dateMenuNotificationsRemoved) {
            let children = this.dateMenuHolder.get_children()
            for (const item of children) {
                this.dateMenuHolder.remove_child(item)
            }
            this.dateMenuHolder.add_child(this.dateMenuNotifications)
            for (const item of children) {
                this.dateMenuHolder.add_child(item)
            }
            Main.panel.statusArea.dateMenu.menu.box.style = ""
            this.dateMenuHolder = null
            this.dateMenuNotificationsRemoved = null
        }
        if (this.dateMenuBoxBackupClass) {
            DateMenu.menu.box.style_class = this.dateMenuBoxBackupClass
            this.dateMenuBoxBackupClass = null
        }

        // restore date menu media control
        if (this.dateMenuMediaControl) {
            let list = this.dateMenuNotifications
                .last_child.first_child.last_child
            let listItems = list.get_children()
            list.add_child(this.dateMenuMediaControl)
            for (const item of listItems) {
                list.remove_child(item)
            }
            for (const item of listItems) {
                list.add_child(item)
            }
            this.dateMenuMediaControl = null
        }
        this.dateMenuNotifications = null

        // restore weather fix
        if (this.weatherFixBackupClass) {
            Main.panel.statusArea.dateMenu.menu.box.style_class = this.weatherFixBackupClass
            this.weatherFixBackupClass = null
        }

        // disconnect all events
        if (this.eventDisconnector) {
            for (const disconnector of this.eventDisconnector) {
                let handler = disconnector.shift()
                handler(...disconnector)
            }
            this.eventDisconnector = null
        }
    }
}

// handling extension
var extension
var settings
function enable() {
    settings = ExtensionUtils.getSettings(Me.metadata['settings-schema'])
    extension = new ExtensionClass(settings)
    extension.load()
}
function disable() {
    settings = null
    extension.unload()
    extension = null
}
