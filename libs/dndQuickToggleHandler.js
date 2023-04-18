const { Gio, GObject } = imports.gi;
const { QuickToggle, SystemIndicator } = imports.ui.quickSettings;
const { St } = imports.gi;

const DndQuickToggle = GObject.registerClass(
  class DndQuickToggle extends QuickToggle {
    _init() {
      super._init({
        title: "Do Not Disturb",
        iconName: "notifications-disabled-symbolic",
      });

      this.label = "Do Not Disturb";

      this._settings = new Gio.Settings({
        schema_id: "org.gnome.desktop.notifications",
      });

      this._changedId = this._settings.connect("changed::show-banners", () =>
        this._sync()
      );

      this.connectObject(
        "destroy",
        () => this._settings.run_dispose(),
        "clicked",
        () => this._toggleMode(),
        this
      );

      this._sync();
    }

    _toggleMode() {
      this._settings.set_boolean(
        "show-banners",
        !this._settings.get_boolean("show-banners")
      );
    }

    _sync() {
      const checked = !this._settings.get_boolean("show-banners");
      if (this.checked !== checked) this.set({ checked });
    }
  }
);

var Indicator = GObject.registerClass(
  class Indicator extends SystemIndicator {
    _init() {
      super._init();

      this._indicator = this._addIndicator();

      this._indicator.icon_name = "notifications-disabled-symbolic";
      this.quickSettingsItems.push(new DndQuickToggle());

      this._settings = new Gio.Settings({
        schema_id: "org.gnome.desktop.notifications",
      });

      this._changedId = this._settings.connect("changed::show-banners", () =>
        this._sync()
      );

      this._sync();
    }

    _sync() {
      const checked = !this._settings.get_boolean("show-banners");
      if (checked) {
        this._indicator.visible = true;
      } else {
        this._indicator.visible = false;
      }
    }
  }
);
