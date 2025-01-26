import { Extension } from "resource:///org/gnome/shell/extensions/extension.js"

import { logger } from "./libs/utility.js"
import { Global } from "./global.js"
import { type FeatureBase } from "./libs/feature.js"
import { DndQuickToggleFeature } from "./features/toggle/dndQuickToggle.js"
import { UnsafeQuickToggleFeature } from "./features/toggle/unsafeQuickToggle.js"
import { MediaWidgetFeature } from "./features/widget/media.js"
import { WeatherWidgetFeature } from "./features/widget/weather.js"
import { NotificationsWidgetFeature } from "./features/widget/notifications.js"
import { TogglesOrderFeature } from "./features/layout/toggles.js"
import { SystemItemsOrderFeature } from "./features/layout/systemItems.js"
import { DateMenuFeature } from "./features/dateMenu.js"
import { OverlayMenu } from "./features/overlayMenu.js"
import { LayoutCustomize } from "./features/layoutCustomize.js"
import { MenuAnimation } from "./features/menuAnimation.js"
import { DebugFeature } from "./features/debug.js"

export default class QstExtension extends Extension {
	private features: FeatureBase[]
	private debug: DebugFeature

	disable() {
		logger("Unloading ...")
		let start = +Date.now()

		// Unload features
		for (const feature of this.features) {
			logger(`Unload feature '${feature.constructor.name}'`)
			feature.unload()
		}
		this.features = null

		// Unload debug feature
		this.debug.unload()
		this.debug = null

		// Unload global context
		Global.unload()

		logger("Diabled. " + (+new Date() - start) + "ms taken")
	}

	enable() {
		logger("Loading ...")
		let start = +Date.now()

		// Load global context
		Global.load(this)

		// Load debug feature
		this.debug = new DebugFeature()
		this.debug.load()

		// Load features
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

		logger("Loaded. " + (+Date.now() - start) + "ms taken")
	}
}
