import { Global } from "../../global.js"
import { FeatureBase, SettingLoader } from "../../libs/feature.js"

export interface OrderItem {
	constructorName?: string
	labelTextRegex?: string
	friendlyName?: string
	nonOrdered?: boolean
	isSystem?: boolean
}
export namespace OrderItem {
	export function match(a: OrderItem, b: OrderItem) {
		if (
			a.isSystem != b.isSystem
			|| a.nonOrdered != b.nonOrdered
		) return false
		if (a.nonOrdered) return true
		if (a.isSystem) return a.constructorName == b.constructorName
		return (
			a.constructorName == b.constructorName
			&& a.labelTextRegex == b.labelTextRegex
			&& a.friendlyName == b.friendlyName
		)
	}
}

export class TogglesOrderFeature extends FeatureBase {
	// #region settings
	enabled: boolean
	order: OrderItem[]
	loadSettings(loader: SettingLoader): void {
		this.enabled = loader.loadBoolean("toggle-order-enabled")
		this.order = loader.loadValue("toggle-order")
	}
	// #endregion settings

	onLoad(): void {
		
	}
	onUnload(): void {}
}
