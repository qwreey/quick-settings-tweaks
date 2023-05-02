const { Gio, GObject } = imports.gi
const { QuickToggle, SystemIndicator } = imports.ui.quickSettings
const { St } = imports.gi
const ExtensionUtils = imports.misc.extensionUtils

var UnsafeQuickToggle = GObject.registerClass(
  class UnsafeQuickToggle extends QuickToggle {
    _updateIcon() {
      this.iconName = this.checked ? "channel-insecure-symbolic" : "channel-secure-symbolic"
    }

    _init(onUpdate) {
      super._init({
        label: ExtensionUtils.gettext("Unsafe Mode"),
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
