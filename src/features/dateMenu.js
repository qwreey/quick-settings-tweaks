import { featureReloader } from "../libs/utility.js"
import { GnomeContext } from "../libs/gnome.js"

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
      GnomeContext.DateMenuMediaControl.hide()
      this.dateMenuMediaControlConnection = GnomeContext.DateMenuMediaControl.connect(
        "show",GnomeContext.DateMenuMediaControl.hide.bind(GnomeContext.DateMenuMediaControl)
      )
    }

    // remove notifications from date menu
    if (this.settings.get_boolean("datemenu-remove-notifications")) {
      this.dateMenuNotificationsRemoved = true
      GnomeContext.DateMenuNotifications.hide()
      GnomeContext.DateMenuBox.style = "padding: 4px 6px 4px 0px;"
      this.dateMenuConnection = GnomeContext.DateMenuNotifications.connect("show", ()=> GnomeContext.DateMenuNotifications.hide)
    }

    // datemenu fix weather widget
    if (this.settings.get_boolean("datemenu-fix-weather-widget")) {
      this.weatherFixBackupClass = GnomeContext.DateMenuBox.style_class
      GnomeContext.DateMenuBox.style_class += " qwreey-fixed-weather"
    }
  }

  unload() {
    // disable feature reloader
    featureReloader.disable(this);

    // restore media control
    if (this.dateMenuMediaControlRemoved) {
      GnomeContext.DateMenuMediaControl.disconnect(this.dateMenuMediaControlConnection);
      if (GnomeContext.DateMenuMediaControl._shouldShow()) GnomeContext.DateMenuMediaControl.show();
      this.dateMenuMediaControlRemoved = null;
      this.dateMenuMediaControlConnection = null;
    }

    // restore notifications to date menu
    if (this.dateMenuNotificationsRemoved) {
      GnomeContext.DateMenuNotifications.disconnect(this.dateMenuConnection);
      GnomeContext.DateMenuNotifications.show();
      GnomeContext.DateMenuBox.style = "";
      this.dateMenuNotificationsRemoved = null;
    }

    // undo weather fix
    if (this.weatherFixBackupClass) {
      GnomeContext.DateMenuBox.style_class = this.weatherFixBackupClass;
      this.weatherFixBackupClass = null;
    }
  }
};
