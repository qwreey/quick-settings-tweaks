/**
 * Viewer Note:
 * stylesheet and javascript files are compiled from scss and typescript. 
 * To modify this extension, please check original source-codes from repository
 * https://github.com/qwreey/quick-settings-tweaks
*/
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js"
import Logger from "./libs/shared/logger.js"
import Global from "./global.js"
import Config from "./config.js"
import { type FeatureBase } from "./libs/shell/feature.js"
import { DndQuickToggleFeature } from "./features/toggle/dndQuickToggle.js"
import { UnsafeQuickToggleFeature } from "./features/toggle/unsafeQuickToggle.js"
import { MediaWidgetFeature } from "./features/widget/media.js"
import { WeatherWidgetFeature } from "./features/widget/weather.js"
import { NotificationsWidgetFeature } from "./features/widget/notifications.js"
import { TogglesLayoutFeature } from "./features/layout/toggles.js"
import { SystemItemsLayoutFeature } from "./features/layout/systemItems.js"
import { DateMenuLayoutFeature } from "./features/layout/dateMenu.js"
import { OverlayMenu } from "./features/overlayMenu.js"
import { MenuAnimation } from "./features/menuAnimation.js"
import { DebugFeature } from "./features/debug.js"
import { VolumeMixerWidgetFeature } from "./features/widget/volumeMixer.js"
import { SystemIndicatorLayoutFeature } from "./features/layout/systemIndicator.js"
import { VerticalProp } from "./libs/shell/compat.js"

export default class QstExtension extends Extension {
	private features: FeatureBase[]
	private debug: DebugFeature

	disable() {
		Logger(`Extension ${this.metadata.name} deactivation started`)
		let start = +Date.now()

		// Unload debug feature
		this.debug.unload()
		this.debug = null

		// Unload features
		for (const feature of this.features) {
			Logger(`Unload feature '${feature.constructor.name}'`)
			feature.unload()
		}
		this.features = null // Null-out all features, loaded objects, arrays should be GC'd

		// Unload global context
		Global.unload()

		Logger("Diabled. " + (+new Date() - start) + "ms taken")
	}

	enable() {
		// Load global context
		Global.load(this)

		// Create features
		this.features = [
			new DndQuickToggleFeature(),
			new UnsafeQuickToggleFeature(),
			// new InputOutputFeature(),
			new NotificationsWidgetFeature(),
			new MediaWidgetFeature(),
			new VolumeMixerWidgetFeature(),
			new DateMenuLayoutFeature(),
			new WeatherWidgetFeature(),
			new OverlayMenu(),
			new MenuAnimation(),
			new SystemItemsLayoutFeature(),
			new TogglesLayoutFeature(),
			new SystemIndicatorLayoutFeature(),
		]

		// Load debug feature
		this.debug = new DebugFeature()
		this.debug.load()
		Logger(`Extension activation started, version: ${Config.version}`)

		// Load features
		Logger.debug("Initializing features ...")
		let start = +Date.now()
		for (const feature of this.features) {
			Logger.debug(()=>`Loading feature '${feature.constructor.name}'`)
			feature.load()
		}
		Logger(`Extension Loaded, ${+Date.now() - start}ms taken`)
	}
}
