import { Extension } from "resource:///org/gnome/shell/extensions/extension.js"

import { logger } from "./libs/utility.js"
import { Global } from "./global.js"
import Config from "./config.js"
import { type FeatureBase } from "./libs/feature.js"
import { DndQuickToggleFeature } from "./features/toggle/dndQuickToggle.js"
import { UnsafeQuickToggleFeature } from "./features/toggle/unsafeQuickToggle.js"
import { MediaWidgetFeature } from "./features/widget/media.js"
import { WeatherWidgetFeature } from "./features/widget/weather.js"
import { NotificationsWidgetFeature } from "./features/widget/notifications.js"
import { TogglesOrderFeature } from "./features/order/toggles.js"
import { SystemItemsOrderFeature } from "./features/order/systemItems.js"
import { DateMenuFeature } from "./features/dateMenu.js"
import { OverlayMenu } from "./features/overlayMenu.js"
import { InputOutputFeature } from "./features/inputOutput.js"
import { LayoutCustomize } from "./features/layoutCustomize.js"
import { MenuAnimation } from "./features/menuAnimation.js"

export default class QstExtension extends Extension {
	private features: FeatureBase[]

	disable() {
		logger("Unloading ...")
		let start = +Date.now()

		// Unload features
		for (const feature of this.features) {
			logger(`Unload feature '${feature.constructor.name}'`)
			feature.unload()
		}
		this.features = null
		Global.unload()

		// @ts-ignore
		if (global.QST) delete global.QST

		logger("Diabled. " + (+new Date() - start) + "ms taken")
	}

	enable() {
		logger("Loading ...")
		let start = +Date.now()

		if (Config.isDevelopmentBuild) {
			logger("!! Development build !!")
			// @ts-ignore
			global.QST = {
				Global,
				Extension: this,
				Config,
			}
		}

		// Load features
		Global.load(this)
		for (const feature of this.features = [
			new DndQuickToggleFeature(),
			new UnsafeQuickToggleFeature(),
			// new VolumeMixerFeature(),
			// new ButtonRemoverFeature(),
			// new InputOutputFeature(),
			new LayoutCustomize(),
			new NotificationsWidgetFeature(),
			new MediaWidgetFeature(),
			new DateMenuFeature(),
			new WeatherWidgetFeature(),
			new OverlayMenu(),
			new MenuAnimation(),
			new SystemItemsOrderFeature(),
			new TogglesOrderFeature(),
		]) {
			logger(`Loading feature '${feature.constructor.name}'`)
			feature.load()
		}

		// @ts-ignore
		if (Config.isDevelopmentBuild) global.QST.Features = this.features,

		logger("Loaded. " + (+Date.now() - start) + "ms taken")
	}
}
