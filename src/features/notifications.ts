import { NotificationWidget } from "../components/notificationWidget.js"
import { Global } from "../global.js"
import { FeatureBase, SettingLoader } from "../libs/feature.js"

// FIXME: size change? issue when long noti showing
export class NotificationsFeature extends FeatureBase {
	// #region settings
	enabled: boolean
	useNativeControls: boolean
	autoHide: boolean
	maxHeight: number
	compact: boolean
	removeShadow: boolean
	override loadSettings(loader: SettingLoader): void {
		this.enabled = loader.loadBoolean("notifications-enabled")
		this.useNativeControls = loader.loadBoolean("notifications-use-native-controls")
		this.autoHide = loader.loadBoolean("notifications-autohide")
		this.maxHeight = loader.loadInt("notifications-max-height")
		this.compact = loader.loadBoolean("notifications-compact")
		this.removeShadow = loader.loadBoolean("notifications-remove-shadow")
	}
	// #endregion settings

	notificationWidget: NotificationWidget
	updateMaxHeight() {
		this.notificationWidget.style = `max-height:${this.maxHeight}px;`
	}
	updateStyleClass() {
		let style = "QSTWEAKS-notifications"
		if (this.useNativeControls) style += " QSTWEAKS-use-native-controls"
		if (this.compact) style += " QSTWEAKS-message-compact"
		if (this.removeShadow) style += " QSTWEAKS-message-remove-shadow"
		this.notificationWidget.style_class = style
	}

	override reload(key: string): void {
		switch (key) {
			case "notifications-max-height":
				this.updateMaxHeight()
				break
			case "notifications-compact":
			case "notifications-remove-shadow":
				this.updateStyleClass()
				break
			default:
				super.reload()
				break
		}
	}
	override onLoad(): void {
		if (!this.enabled) return

		// Create Notification Box
		this.maid.destroyJob(
			this.notificationWidget = new NotificationWidget({
				autoHide: this.autoHide,
				useNativeControls: this.useNativeControls
			})
		)

		// Update styles
		this.updateStyleClass()
		this.updateMaxHeight()

		// add
		// FIXME: with layout manager
		switch (this.position) {
			case "top":
				Global.QuickSettingsGrid.insert_child_at_index(this.notificationWidget,
					// get system item index
					Global.QuickSettingsGrid.get_children().findIndex((child) => child.constructor?.name == "SystemItem") + 1
				)
				break
			case "bottom":
				Global.QuickSettingsGrid.add_child(this.notificationWidget)
				break
		}
		Global.QuickSettingsGrid.layout_manager.child_set_property(
			Global.QuickSettingsGrid, this.notificationWidget, 'column-span', 2
		)
	}
	override onUnload(): void {
		this.notificationWidget = null
	}
}
