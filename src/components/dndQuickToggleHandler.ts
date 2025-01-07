import Gio from "gi://Gio"
import GObject from "gi://GObject"
import { QuickToggle, SystemIndicator } from "resource:///org/gnome/shell/ui/quickSettings.js"

class DndQuickToggle extends QuickToggle {
    _settings: Gio.Settings

    _init() {
        super._init({
            title: _('Do Not Disturb'),
            iconName: "notifications-disabled-symbolic",
        })

        this._settings = new Gio.Settings({
            schema_id: "org.gnome.desktop.notifications",
        })
        this._settings.connectObject("changed::show-banners", this._sync.bind(this), this)

        this.connect("clicked", this._toggleMode.bind(this))

        this._sync()
    }

    _updateIcon() {
        this.iconName = this.checked ? "notifications-disabled-symbolic" : "notifications-symbolic"
    }

    // Toggle DND
    _toggleMode() {
        this._settings.set_boolean(
            "show-banners",
            !this._settings.get_boolean("show-banners")
        )
    }

    // Sync DND status
    _sync() {
        const checked = !this._settings.get_boolean("show-banners")
        if (this.checked !== checked) this.set({ checked })
        this._updateIcon()
    }

    destroy() {
        this._settings = null
        super.destroy()
    }
}
GObject.registerClass(DndQuickToggle)

export class Indicator extends SystemIndicator {
    _init() {
        super._init()

        this._indicator = this._addIndicator()
        this._indicator.icon_name = "notifications-disabled-symbolic"

        this.quickSettingsItems.push(new DndQuickToggle())

        this._settings = new Gio.Settings({
            schema_id: "org.gnome.desktop.notifications",
        })
        this._settings.connectObject("changed::show-banners", this._sync.bind(this), this)
        this._sync()
    }

    _sync() {
        const checked = !this._settings.get_boolean("show-banners")
        if (checked) {
            this._indicator.visible = true
        } else {
            this._indicator.visible = false
        }
    }

    destroy() {
        this.quickSettingsItems.forEach(item => item.destroy())
        this._settings = null
        super.destroy()
    }
}
GObject.registerClass(Indicator)
