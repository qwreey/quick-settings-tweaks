const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const QuickSettingsMenu = imports.ui.main.panel.statusArea.quickSettings;
const featureReloader = Me.imports.libs.featureReloader;
const { QuickSettings } = Me.imports.libs.gnome;
const { Indicator } = Me.imports.libs.dndQuickToggleHandler;
const { DateMenu } = Me.imports.libs.gnome;
const { Gio, GObject } = imports.gi;

var dndQuickToggleFeature = class {
  load() {
    // setup reloader
    featureReloader.enableWithSettingKeys(this, [
      "add-dnd-quick-toggle-enabled",
    ]);

    this.datemenu_dnd = null;
    // check is feature enabled
    if (!this.settings.get_boolean("add-dnd-quick-toggle-enabled")) return;

    // Add DND Quick Toggle
    this.dndToggle = new Indicator();
    QuickSettings._indicators.add_child(this.dndToggle);
    QuickSettings._addItems(this.dndToggle.quickSettingsItems);

    // This is a bit of a hack, but it works for now. I took this from the
    // gjs guide on how to position items above the background apps menu.
    function addQuickSettingsItems(items) {
      // Add the items with the built-in function
      QuickSettingsMenu._addItems(items);

      // Ensure the tile(s) are above the background apps menu
      for (const item of items) {
        QuickSettingsMenu.menu._grid.set_child_below_sibling(
          item,
          QuickSettingsMenu._backgroundApps.quickSettingsItems[0]
        );
      }
    }

    addQuickSettingsItems(this.dndToggle.quickSettingsItems);

    //remove DND button from datemenu
    this.datemenu_dnd = DateMenu.last_child.last_child;
    this.datemenu_dnd.hide();
    this.datemenu_dnd_connection = this.datemenu_dnd.connect("show", () => {
      this.datemenu_dnd.hide();
    });
  }

  unload() {
    // disable feature reloader
    featureReloader.disable(this);

    if (this.datemenu_dnd == null) return;

    //put back the button to the datemenu
    this.datemenu_dnd.disconnect(this.datemenu_dnd_connection);
    this.datemenu_dnd_connection = null;
    const _settings = new Gio.Settings({
      schema_id: "org.gnome.desktop.notifications",
    });
    if (!_settings.get_boolean("show-banners")) {
      this.datemenu_dnd.show();
    }
    // Remove DND Quick Toggle
    if (this.dndToggle) {
      const dndQSItems = this.dndToggle.quickSettingsItems[0];
      dndQSItems.get_parent().remove_child(dndQSItems);
      this.dndToggle.get_parent().remove_child(this.dndToggle);
      this.dndToggle.destroy();
      this.dndToggle = null;
    }
  }
};
