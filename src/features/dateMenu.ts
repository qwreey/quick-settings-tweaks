import { GnomeContext } from "../libs/gnome.js"
import { FeatureBase, SettingLoader } from "../libs/feature.js"

export class DateMenuFeature extends FeatureBase {
    // #region settings
    removeMediaControl: boolean
    removeNotifications: boolean
    loadSettings(loader: SettingLoader): void {
        this.removeMediaControl = loader.loadBoolean("datemenu-remove-media-control")
        this.removeNotifications = loader.loadBoolean("datemenu-remove-notifications")
    }
    // #endregion settings

    onLoad() {
        // remove media control from date menu
        if (this.removeMediaControl) {
            GnomeContext.MediaSection.hide()
            this.maid.connectJob(
                GnomeContext.MediaSection,
                "show",
                () => GnomeContext.MediaSection.hide()
            )
        }

        // remove notifications from date menu
        if (this.removeNotifications) {
            GnomeContext.NotificationSection.hide()
            this.maid.connectJob(
                GnomeContext.NotificationSection,
                "show",
                () => GnomeContext.NotificationSection.hide()
            )
            // GnomeContext.DateMenuBox.style = "padding: 4px 6px 4px 0px;"
        }

        // datemenu fix weather widget
        // if (this.settings.get_boolean("datemenu-fix-weather-widget")) {
        //     this.weatherFixBackupClass = GnomeContext.DateMenuBox.style_class
        //     GnomeContext.DateMenuBox.style_class += " qwreey-fixed-weather"
        // }
    }
    onUnload(): void {}
}
