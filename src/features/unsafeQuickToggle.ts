import { Indicator } from "../components/unsafeQuickToggleHandler.js"
import { GnomeContext } from "../libs/gnome.js"
import { FeatureBase, SettingLoader } from "../libs/feature.js"

export class UnsafeQuickToggleFeature extends FeatureBase {
    // #region settings
    enabled: boolean
    override loadSettings(loader: SettingLoader): void {
        this.enabled = loader.loadBoolean("add-unsafe-quick-toggle-enabled")
    }
    // #endregion settings

    indicator: Indicator
    override onLoad(): void {
        if (!this.enabled) return

        // Load last state
        global.context.unsafe_mode = this.settings.get_boolean("last-unsafe-state")

        // Add Unsafe Quick Toggle
        this.maid.destroyJob(
            this.indicator = new Indicator(
                (state) => this.settings.set_boolean("last-unsafe-state", state)
            )
        )
        // @ts-ignore
        GnomeContext.QuickSettings.addExternalIndicator(this.indicator)
    }
    override onUnload(): void {
        global.context.unsafe_mode = false
        this.indicator = null
    }
}
