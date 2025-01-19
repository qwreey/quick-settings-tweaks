import { Global } from "../global.js"
import { FeatureBase, SettingLoader } from "../libs/feature.js"

export interface OrderItem {
	constructorName?: string
	labelTextRegex?: string
	nonOrdered?: boolean
	isSystem?: boolean
	friendlyName?: string
}

export class QuickTogglesOrderFeature extends FeatureBase {
	// #region settings
	enabled: boolean
	order: string[]
	loadSettings(loader: SettingLoader): void {
		this.enabled = loader.loadBoolean("quick-toggle-order-enabled")
		this.order = loader.loadStrv("quick-toggle-order")
	}
	// #endregion settings
}
