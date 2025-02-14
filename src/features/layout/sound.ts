import { FeatureBase, SettingLoader } from "../../libs/shell/feature.js"
import GObject from "gi://GObject"

// TODO: migration from qst 1.8
export class SoundLayoutFeature extends FeatureBase {
	// #region settings
	
	override loadSettings(loader: SettingLoader): void {
		throw GObject.NotImplementedError
	}
	// #endregion settings

	override onLoad(): void {
		throw GObject.NotImplementedError
	}
	override onUnload(): void {
		throw GObject.NotImplementedError
	}
}
