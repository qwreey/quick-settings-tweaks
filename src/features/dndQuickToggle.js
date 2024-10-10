import { featureReloader } from "../libs/utility.js"
import { GnomeContext } from "../libs/gnome.js"
import { Indicator } from "../components/dndQuickToggleHandler.js"
import Gio from "gi://Gio"

export class DndQuickToggleFeature {
    load() {
        // setup reloader
        featureReloader.enableWithSettingKeys(this, [
            "add-dnd-quick-toggle-enabled",
        ])
        if (!this.settings.get_boolean("add-dnd-quick-toggle-enabled")) return

        // Add DND Quick Toggle
        this.dndToggle = new Indicator()
        GnomeContext.QuickSettings.addExternalIndicator(this.dndToggle)

        //remove DND button from datemenu
        this.datemenuDnd = GnomeContext.DateMenu.last_child.last_child
        this.datemenuDnd.hide()
        this.datemenu_dnd_connection = this.datemenuDnd.connect("show", () => {
            this.datemenuDnd.hide()
        })
    }

    unload() {
        // disable feature reloader
        featureReloader.disable(this)

        if (this.datemenuDnd == null) return

        // restore date menu dnd icon
        this.datemenuDnd.disconnect(this.datemenu_dnd_connection)
        this.datemenu_dnd_connection = null
        const _settings = new Gio.Settings({
            schema_id: "org.gnome.desktop.notifications",
        })
        if (!_settings.get_boolean("show-banners")) {
            this.datemenuDnd.show()
        }

        // Remove DND Quick Toggle
        if (this.dndToggle) {
            this.dndToggle.destroy()
            this.dndToggle = null
        }
    }
}
