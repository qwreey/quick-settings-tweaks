const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const featureReloader = Me.imports.libs.featureReloader
const {
    DateMenuNotifications,
    DateMenuMediaControl,
    DateMenuHolder,
    DateMenuBox
} = Me.imports.libs.gnome
const { Indicator } = Me.imports.libs.dndQuickToogleHandler

var dateMenuFeature = class {
    constructor(settings) {
        this.settings = settings
    }

    load() {
        // setup reloader
        featureReloader.enableWithSettingKeys(this,[
            "datemenu-remove-media-control",
            "datemenu-remove-notifications",
            "datemenu-fix-weather-widget"
        ])

        // remove media control from date menu
        if (this.settings.get_boolean("datemenu-remove-media-control")) {
            this.mediaControlParent = DateMenuMediaControl.get_parent()
            this.mediaControlParent.remove_child(DateMenuMediaControl)
        }

        // remove notifications from date menu
        if (this.settings.get_boolean("datemenu-remove-notifications")) {
            this.dateMenuNotificationsRemoved = true
            DateMenuHolder.remove_child(DateMenuNotifications)
            DateMenuBox.style = "padding: 4px 6px 4px 0px;"
        }
        
        // datemenu fix weather widget
        if (this.settings.get_boolean("datemenu-fix-weather-widget")) {
            this.weatherFixBackupClass = DateMenuBox.style_class
            DateMenuBox.style_class += " qwreey-fixed-weather"
        }
    }

    unload() {
        // disable feature reloader
        featureReloader.disable(this)

        // restore media control to date menu
        if (this.mediaControlParent) {
            let listItems = this.mediaControlParent.get_children()
            this.mediaControlParent.add_child(DateMenuMediaControl)
            for (const item of listItems) {
                this.mediaControlParent.remove_child(item)
            }
            for (const item of listItems) {
                this.mediaControlParent.add_child(item)
            }
            this.mediaControlParent = null
        }

        // restore notifications to date menu
        if (this.dateMenuNotificationsRemoved) {
            DateMenuHolder.add_child(DateMenuNotifications)
            DateMenuBox.style = ""
            this.dateMenuNotificationsRemoved = null
        }

        // undo weather fix
        if (this.weatherFixBackupClass) {
            DateMenuBox.style_class = this.weatherFixBackupClass
            this.weatherFixBackupClass = null
        }
    }
}

