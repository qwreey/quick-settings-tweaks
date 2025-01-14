import { WeatherWidget } from "../components/weatherWidget.js"
import { Global } from "../global.js"
import { FeatureBase, SettingLoader } from "../libs/feature.js"

export class WeatherFeature extends FeatureBase {
	// #region settings
	enabled: boolean
	removeShadow: boolean
	override loadSettings(loader: SettingLoader): void {
		this.enabled = loader.loadBoolean("weather-enabled")
		this.removeShadow = loader.loadBoolean("weather-remove-shadow")
	}
	// #endregion settings

	weatherWidget: WeatherWidget
	updateStyleClass() {
		let style = "QSTWEAKS-weather"
		if (this.removeShadow) style += " QSTWEAKS-weather-remove-shadow"
		this.weatherWidget.styleClass = style
	}

	override reload(key: string): void {
		switch (key) {
			case "weather-remove-shadow":
				this.updateStyleClass()
				break
			default:
				super.reload()
				break
		}
	}
	override onLoad(): void {
		if (!this.enabled) return
		this.maid.destroyJob(
			this.weatherWidget = new WeatherWidget()
		)
		this.updateStyleClass()

		Global.QuickSettingsGrid.add_child(this.weatherWidget)
		Global.QuickSettingsGrid.layout_manager.child_set_property(
			Global.QuickSettingsGrid, this.weatherWidget, 'column-span', 2
		)
	}
	override onUnload(): void {
		this.weatherWidget = null
	}
}
