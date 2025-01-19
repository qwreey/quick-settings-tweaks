import { Global } from "../global.js"
import { FeatureBase, SettingLoader } from "../libs/feature.js"

export interface OrderItem {
	constructorName?: string
	labelTextRegex?: string
	nonOrdered?: boolean
	isSystem?: boolean
	friendlyName?: string
}

export class TogglesOrderFeature extends FeatureBase {
	// #region settings
	enabled: boolean
	order: string[]
	loadSettings(loader: SettingLoader): void {
		this.enabled = loader.loadBoolean("toggle-order-enabled")
		this.order = loader.loadStrv("toggle-order")
	}
	// #endregion settings

	onLoad(): void {
		
	}
	onUnload(): void {}
}
