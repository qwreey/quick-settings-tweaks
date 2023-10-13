import GObject from "gi://GObject"
import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js"
import { QuickToggle, SystemIndicator } from "resource:///org/gnome/shell/ui/quickSettings.js"

const UnsafeQuickToggle = GObject.registerClass(
  class UnsafeQuickToggle extends QuickToggle {
    _updateIcon() {
      this.iconName = this.checked ? "channel-insecure-symbolic" : "channel-secure-symbolic"
    }

    _init(onUpdate) {
      super._init({
        title: _("Unsafe Mode"),
        iconName: "channel-insecure-symbolic",
      })
      this._onUpdate = onUpdate

      // bind click
      this.connect("clicked", this._toggleMode.bind(this))

      // Fetch global context
      this._sync()
    }

    // Toggle context
    _toggleMode() {
      this.checked = !global.context.unsafe_mode
      global.context.unsafe_mode = this.checked
      this._updateIcon()
      this._onUpdate(this.checked)
    }

    // Sync context
    _sync() {
      this.checked = global.context.unsafe_mode
      this._updateIcon()
    }
  }
)

export const Indicator = GObject.registerClass(
  class Indicator extends SystemIndicator {
    _init(onUpdate) {
        super._init()

        this.quickSettingsItems.push(new UnsafeQuickToggle(onUpdate))
    }

    destroy() {
      this.quickSettingsItems.forEach(item => item.destroy())
      // After 45, this is not required
      // this._indicator.destroy()
      super.destroy()
    }
});