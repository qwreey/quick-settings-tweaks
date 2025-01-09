import { UnsafeIndicator } from "../components/unsafeQuickToggleHandler.js"
import { Global } from "../global.js"
import { FeatureBase, SettingLoader } from "../libs/feature.js"

export class UnsafeQuickToggleFeature extends FeatureBase {
	// #region settings
	enabled: boolean
	override loadSettings(loader: SettingLoader): void {
		this.enabled = loader.loadBoolean("add-unsafe-quick-toggle-enabled")
	}
	// #endregion settings

	indicator: UnsafeIndicator
	override onLoad(): void {
		if (!this.enabled) return

		// Load last state
		global.context.unsafe_mode = Global.Settings.get_boolean("last-unsafe-state")

		// Add Unsafe Quick Toggle
		this.maid.destroyJob(
			this.indicator = new UnsafeIndicator(
				(state) => Global.Settings.set_boolean("last-unsafe-state", state)
			)
		)
		// @ts-ignore
		Global.QuickSettings.addExternalIndicator(this.indicator)
	}
	override onUnload(): void {
		global.context.unsafe_mode = false
		this.indicator = null
	}
}
