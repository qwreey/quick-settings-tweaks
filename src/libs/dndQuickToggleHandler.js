import Gio from "gi://Gio"
import GObject from "gi://GObject"
import { QuickToggle, SystemIndicator } from "resource:///org/gnome/shell/ui/quickSettings.js"

const DndQuickToggle = GObject.registerClass(
  class DndQuickToggle extends QuickToggle {
    _init() {
      super._init({
        title: _('Do Not Disturb'),
        iconName: "notifications-disabled-symbolic",
      })

      this._settings = new Gio.Settings({
        schema_id: "org.gnome.desktop.notifications",
      })

      this._changedId = this._settings.connect("changed::show-banners", this._sync.bind(this))

      this.connect("clicked", this._toggleMode.bind(this))
      // this.connectObject(
      //   // Destroy event
      //   // From Just Perfection's review:
      //   // Extensions cannot use `run_dispose()` (line 21 libs/dndQuickToggleHandler.js):
      //   // > This function should only be called from object system implementations.
      //   // https://gjs-docs.gnome.org/gobject20~2.0/gobject.object#method-run_dispose
      //   //"destroy", this._settings.run_dispose.bind(this._settings),

      //   // Clicked event
      //   "clicked", this._toggleMode.bind(this),

      //   this
      // )

      // Fetch DND status once
      this._sync()
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
    }
  }
)

export const Indicator = GObject.registerClass(
  class Indicator extends SystemIndicator {
    _init() {
      super._init()

      this._indicator = this._addIndicator()

      this._indicator.icon_name = "notifications-disabled-symbolic"
      this.quickSettingsItems.push(new DndQuickToggle())

      this._settings = new Gio.Settings({
        schema_id: "org.gnome.desktop.notifications",
      })

      // sync
      this._changedId = this._settings.connect("changed::show-banners", this._sync.bind(this))
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
      this._indicator.destroy()
      super.destroy()
    }
  }
)
