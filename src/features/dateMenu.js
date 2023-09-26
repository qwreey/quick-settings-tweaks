import { featureReloader } from "../libs/utility.js"
import {
  DateMenuNotifications,
  DateMenuMediaControl,
  DateMenuBox,
} from "../libs/gnome.js"

export class DateMenuFeature {
  load() {
    // setup reloader
    featureReloader.enableWithSettingKeys(this, [
      "datemenu-remove-media-control",
      "datemenu-remove-notifications",
      "datemenu-fix-weather-widget",
    ])

    // remove media control from date menu
    if (this.settings.get_boolean("datemenu-remove-media-control")) {
      this.dateMenuMediaControlRemoved = true
      DateMenuMediaControl.hide()
      this.dateMenuMediaControlConnection = DateMenuMediaControl.connect(
        "show",DateMenuMediaControl.hide.bind(DateMenuMediaControl)
      )
    }

    // remove notifications from date menu
    if (this.settings.get_boolean("datemenu-remove-notifications")) {
      this.dateMenuNotificationsRemoved = true
      DateMenuNotifications.hide()
      DateMenuBox.style = "padding: 4px 6px 4px 0px;"
      this.dateMenuConnection = DateMenuNotifications.connect("show", DateMenuNotifications.hide.bind(DateMenuNotifications))
    }

    // datemenu fix weather widget
    if (this.settings.get_boolean("datemenu-fix-weather-widget")) {
      this.weatherFixBackupClass = DateMenuBox.style_class
      DateMenuBox.style_class += " qwreey-fixed-weather"
    }
  }

  unload() {
    // disable feature reloader
    featureReloader.disable(this);

    // restore media control
    if (this.dateMenuMediaControlRemoved) {
      DateMenuMediaControl.disconnect(this.dateMenuMediaControlConnection);
      if (DateMenuMediaControl._shouldShow()) DateMenuMediaControl.show();
      this.dateMenuMediaControlRemoved = null;
      this.dateMenuMediaControlConnection = null;
    }

    // restore notifications to date menu
    if (this.dateMenuNotificationsRemoved) {
      DateMenuNotifications.disconnect(this.dateMenuConnection);
      DateMenuNotifications.show();
      DateMenuBox.style = "";
      this.dateMenuNotificationsRemoved = null;
    }

    // undo weather fix
    if (this.weatherFixBackupClass) {
      DateMenuBox.style_class = this.weatherFixBackupClass;
      this.weatherFixBackupClass = null;
    }
  }
};
