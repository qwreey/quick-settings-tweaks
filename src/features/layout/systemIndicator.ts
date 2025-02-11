import { SystemIndicator } from "resource:///org/gnome/shell/ui/quickSettings.js"
import { FeatureBase, type SettingLoader } from "../../libs/shell/feature.js"
import { SystemIndicatorTracker } from "../../libs/shell/quickSettingsUtils.js"
import Maid from "../../libs/shared/maid.js"
import { Global } from "../../global.js"
import { SystemIndicatorOrderItem } from "../../libs/types/systemIndicatorOrderItem.js"

export class SystemIndicatorLayoutFeature extends FeatureBase {
	// #region settings
	enabled: boolean
	order: SystemIndicatorOrderItem[]
	unordered: SystemIndicatorOrderItem
	loadSettings(loader: SettingLoader): void {
		this.enabled = loader.loadBoolean("system-indicator-layout-enabled")
		this.order = loader.loadValue("system-indicator-layout-order")
		this.unordered = this.order.find(item => item.nonOrdered)
	}
	// #endregion settings

	onIndicatorCreated(maid: Maid, indicator: SystemIndicator): void {
		const rule: SystemIndicatorOrderItem =
			this.order.find(item => SystemIndicatorOrderItem.indicatorMatch(item, indicator))
			?? this.unordered
		if (rule.hide) maid.hideJob(indicator)
	}
	onUpdate(): void {
		const children = Global.Indicators.get_children()
		const head: SystemIndicator[] = []
		const middle: SystemIndicator[] = children.filter(child => child instanceof SystemIndicator) as any
		const tail: SystemIndicator[] = []
		let overNonOrdered: boolean = false
		for (const item of this.order) {
			if (item.nonOrdered) {
				overNonOrdered = true
				continue
			}
			const middleIndex = middle.findIndex(toggle => SystemIndicatorOrderItem.indicatorMatch(item, toggle))
			if (middleIndex == -1) continue
			const toggle = middle[middleIndex]
			middle.splice(middleIndex, 1);
			(overNonOrdered ? tail : head).push(toggle)
		}
		let last: SystemIndicator|null = null
		for (const item of [head, middle, tail].flat()) {
			if (last) Global.Indicators.set_child_above_sibling(item, last)
			last = item
		}
	}

	tracker: SystemIndicatorTracker
	onLoad(): void {
		if (!this.enabled) return
		this.tracker = new SystemIndicatorTracker()
		this.tracker.onIndicatorCreated = this.onIndicatorCreated.bind(this)
		this.tracker.onUpdate = this.onUpdate.bind(this)
		this.tracker.load()
	}
	onUnload(): void {
		const tracker = this.tracker
		if (tracker) {
			this.tracker = null
			tracker.unload()
		}
	}
}
