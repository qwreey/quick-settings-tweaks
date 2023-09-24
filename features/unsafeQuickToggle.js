import { featureReloader } from "../libs/utility.js"
import { Indicator } from "../libs/unsafeQuickToggleHandler.js"
import { QuickSettings } from "../libs/gnome.js"

export class UnsafeQuickToggleFeature {
  load() {
    // setup reloader
    featureReloader.enableWithSettingKeys(this, [
      "add-unsafe-quick-toggle-enabled",
    ])

    // check is feature enabled
    if (!this.settings.get_boolean("add-unsafe-quick-toggle-enabled")) return
    global.context.unsafe_mode = this.settings.get_boolean("last-unsafe-state")

    // Add Unsafe Quick Toggle
    this.unsafeToggle = new Indicator((state)=>this.settings.set_boolean("last-unsafe-state",state))
    QuickSettings.addExternalIndicator(this.unsafeToggle)
  }

  unload() {
    // disable feature reloader
    featureReloader.disable(this)

    if (this.unsafeToggle) {
      this.unsafeToggle.destroy()
      this.unsafeToggle = null
      global.context.unsafe_mode = false
    }
  }
}
