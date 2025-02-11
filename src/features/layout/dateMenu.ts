import { Global } from "../../global.js"
import { FeatureBase, type SettingLoader } from "../../libs/shell/feature.js"
import { logger } from "../../libs/shared/logger.js"

export class DateMenuLayoutFeature extends FeatureBase {
	// #region settings
	hideMediaControl: boolean
	hideNotifications: boolean
	hideLeftBox: boolean
	hideRightBox: boolean
	disableMenu: boolean
	loadSettings(loader: SettingLoader): void {
		this.hideMediaControl = loader.loadBoolean("datemenu-hide-media-control")
		this.hideNotifications = loader.loadBoolean("datemenu-hide-notifications")
		this.hideLeftBox = loader.loadBoolean("datemenu-hide-left-box")
		this.hideRightBox = loader.loadBoolean("datemenu-hide-right-box")
		this.disableMenu = loader.loadBoolean("datemenu-disable-menu")
	}
	// #endregion settings

	onLoad() {
		const originalStyle = (Global.DateMenuBox as any).style_class
		const style = [originalStyle]

		// Hide media control from date menu
		if (this.hideMediaControl) {
			this.maid.hideJob(
				Global.MediaSection,
				()=>true
			)
		}

		// Hide notifications from date menu
		if (this.hideNotifications) {
			this.maid.hideJob(
				Global.NotificationSection,
				()=>true
			)
		}

		// Hide left box from date menu
		if (this.hideLeftBox) {
			const leftBox = Global.DateMenuHolder.get_first_child()
			if (leftBox) {
				this.maid.hideJob(
					leftBox,
					()=>true
				)
			} else {
				logger.error("Failed to get date menu left box")
			}
			style.push("QSTWEAKS-hide-left-box")
		}

		// Hide right box from date menu
		if (this.hideRightBox) {
			const rightBox = Global.DateMenuHolder.get_last_child()
			if (rightBox) {
				this.maid.hideJob(
					rightBox,
					()=>true
				)
			} else {
				logger.error("Failed to get date menu right box")
			}
			style.push("QSTWEAKS-hide-right-box")
		}

		// Disable menu open action
		if (this.disableMenu) {
			Global.DateMenu.reactive = false
			this.maid.functionJob(()=>{
				Global.DateMenu.reactive = true
			})
		}

		// Modify style class
		if (style.length != 1) {
			(Global.DateMenuBox as any).style_class = style.join(" ")
			this.maid.functionJob(()=>{
				(Global.DateMenuBox as any).style_class = originalStyle
			})
		}
	}
	onUnload(): void {
		// @ts-ignore
		if (Global.MediaSection._shouldShow()) Global.MediaSection.show();
		// @ts-ignore
		if (Global.NotificationSection._shouldShow()) Global.NotificationSection.show();
	}
}
