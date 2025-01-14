import { MediaWidget } from "../components/mediaWidget.js"
import { Global } from "../global.js"
import { FeatureBase, SettingLoader } from "../libs/feature.js"

export class MediaFeature extends FeatureBase {
	// #region settings
	enabled: boolean
	compact: boolean
	showProgress: boolean
	override loadSettings(loader: SettingLoader): void {
		this.enabled = loader.loadBoolean("media-enabled")
		this.compact = loader.loadBoolean("media-compact")
		this.showProgress = loader.loadBoolean("media-show-progress")
	}
	// #endregion settings

	mediaWidget?: MediaWidget
	updateStyleClass() {
		let style = "QSTWEAKS-media"
		if (this.compact) style += " QSTWEAKS-message-compact"
		this.mediaWidget.style_class = style
	}

	override reload(key: string): void {
		switch (key) {
			case "media-compact":
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
			this.mediaWidget = new MediaWidget({
				showProgress: this.showProgress
			})
		)

		Global.QuickSettingsGrid.add_child(this.mediaWidget)
		Global.QuickSettingsGrid.layout_manager.child_set_property(
			Global.QuickSettingsGrid, this.mediaWidget, 'column-span', 2
		)

		this.updateStyleClass()
	}
	override onUnload(): void {
		this.mediaWidget = null
	}
}
