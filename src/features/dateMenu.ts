import { Global } from "../global.js"
import { FeatureBase, type SettingLoader } from "../libs/feature.js"
import { logger } from "../libs/logger.js"

export class DateMenuFeature extends FeatureBase {
	// #region settings
	hideMediaControl: boolean
	hideNotifications: boolean
	hideLeftBox: boolean
	hideRightBox: boolean
	disableMenu: boolean
	loadSettings(loader: SettingLoader): void {
		this.hideMediaControl = loader.loadBoolean("datemenu-remove-media-control")
		this.hideNotifications = loader.loadBoolean("datemenu-remove-notifications")
		this.hideLeftBox = loader.loadBoolean("datemenu-hide-left-box")
		this.hideRightBox = loader.loadBoolean("datemenu-hide-right-box")
		this.disableMenu = loader.loadBoolean("datemenu-disable-menu")
	}
	// #endregion settings

	onLoad() {
		// remove media control from date menu
		if (this.hideMediaControl) {
			this.maid.hideJob(
				Global.MediaSection,
				()=>true
			)
		}

		// remove notifications from date menu
		if (this.hideNotifications) {
			this.maid.hideJob(
				Global.NotificationSection,
				()=>true
			)
		}

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
		}

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
		}

		if (this.disableMenu) {
			Global.DateMenuMenu.sensitive = false
			this.maid.functionJob(()=>{
				Global.DateMenuMenu.sensitive = true
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
