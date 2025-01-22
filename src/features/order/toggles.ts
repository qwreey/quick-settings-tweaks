import { type QuickToggle } from "resource:///org/gnome/shell/ui/quickSettings.js"
import { FeatureBase, type SettingLoader } from "../../libs/feature.js"
import { QuickSettingsToggleTracker } from "../../libs/quickSettingsTracker.js"
import Maid from "../../libs/maid.js"
import { Global } from "../../global.js"
import { QuickToggleOrderItem } from "../../libs/quickToggleOrderItem.js"


export class TogglesOrderFeature extends FeatureBase {
	// #region settings
	enabled: boolean
	order: QuickToggleOrderItem[]
	loadSettings(loader: SettingLoader): void {
		this.enabled = loader.loadBoolean("toggle-order-enabled")
		this.order = loader.loadValue("toggle-order")
	}
	// #endregion settings

	onToggleCreated(maid: Maid, toggle: QuickToggle): void {
		const rule: QuickToggleOrderItem|undefined = this.order.find(item => QuickToggleOrderItem.toggleMatch(item, toggle))
		if (!rule) return
		if (rule.hide) maid.hideJob(toggle)
	}
	onUpdate(): void {}

	tracker: QuickSettingsToggleTracker
	onLoad(): void {
		if (!this.enabled) return
		this.tracker = new QuickSettingsToggleTracker()
		this.tracker.onToggleCreated = this.onToggleCreated.bind(this)
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
