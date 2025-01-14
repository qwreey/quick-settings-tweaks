import { WeatherWidget } from "../components/weatherWidget.js"
import { Global } from "../global.js"
import { FeatureBase, SettingLoader } from "../libs/feature.js"

export class WeatherFeature extends FeatureBase {
    // #region settings
    enabled: boolean
    override loadSettings(loader: SettingLoader): void {
        this.enabled = loader.loadBoolean("weather-enabled")
    }
    // #endregion settings

    weatherWidget: WeatherWidget
    override onLoad(): void {
        if (!this.enabled) return
        this.maid.destroyJob(
            this.weatherWidget = new WeatherWidget()
        )

        Global.QuickSettingsGrid.add_child(this.weatherWidget)
        Global.QuickSettingsGrid.layout_manager.child_set_property(
            Global.QuickSettingsGrid, this.weatherWidget, 'column-span', 2
        )
    }
    override onUnload(): void {
        this.weatherWidget = null
    }
}
