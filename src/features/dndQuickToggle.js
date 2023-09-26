import { featureReloader } from "../libs/utility.js"
import { QuickSettings, DateMenu } from "../libs/gnome.js"
import { Indicator } from "../libs/dndQuickToggleHandler.js"
import Gio from "gi://Gio"

export class DndQuickToggleFeature {
  load() {
    // setup reloader
    featureReloader.enableWithSettingKeys(this, [
      "add-dnd-quick-toggle-enabled",
    ])

    this.datemenu_dnd = null
    // check is feature enabled
    if (!this.settings.get_boolean("add-dnd-quick-toggle-enabled")) return

    // Add DND Quick Toggle
    this.dndToggle = new Indicator()
    QuickSettings.addExternalIndicator(this.dndToggle)

    //remove DND button from datemenu
    this.datemenu_dnd = DateMenu.last_child.last_child
    this.datemenu_dnd.hide()
    this.datemenu_dnd_connection = this.datemenu_dnd.connect("show", () => {
      this.datemenu_dnd.hide()
    })
  }

  unload() {
    // disable feature reloader
    featureReloader.disable(this)

    if (this.datemenu_dnd == null) return

    //put back the button to the datemenu
    this.datemenu_dnd.disconnect(this.datemenu_dnd_connection)
    this.datemenu_dnd_connection = null
    const _settings = new Gio.Settings({
      schema_id: "org.gnome.desktop.notifications",
    })
    if (!_settings.get_boolean("show-banners")) {
      this.datemenu_dnd.show()
    }
    // Remove DND Quick Toggle
    if (this.dndToggle) {
      this.dndToggle.destroy()
      this.dndToggle = null
    }
  }
}
