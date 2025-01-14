import { Extension } from "resource:///org/gnome/shell/extensions/extension.js"

import { logger } from "./libs/utility.js"
import { Global } from "./global.js"
import Config from "./config.js"
import { type FeatureBase } from "./libs/feature.js"

import { DndQuickToggleFeature } from "./features/dndQuickToggle.js"
import { UnsafeQuickToggleFeature } from "./features/unsafeQuickToggle.js"
import { NotificationsFeature } from "./features/notifications.js"
import { DateMenuFeature } from "./features/dateMenu.js"
import { MediaFeature } from "./features/media.js"
import { OverlayMenu } from "./features/overlayMenu.js"
import { VolumeMixerFeature } from "./features/volumeMixer.js"
import { ButtonRemoverFeature } from "./features/buttonRemover.js"
import { InputOutputFeature } from "./features/inputOutput.js"
import { LayoutCustomize } from "./features/layoutCustomize.js"
import { WeatherFeature } from "./features/weather.js"
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

		// Load features
		Global.load(this)
		for (const feature of this.features = [
			new DndQuickToggleFeature(),
			new UnsafeQuickToggleFeature(),
			// new VolumeMixerFeature(),
			// new ButtonRemoverFeature(),
			// new InputOutputFeature(),
			new LayoutCustomize(),
			new NotificationsFeature(),
			new MediaFeature(),
			new DateMenuFeature(),
			new WeatherFeature(),
			new OverlayMenu(),
			new MenuAnimation(),
		]) {
			logger(`Loading feature '${feature.constructor.name}'`)
			feature.load()
		}

		// @ts-ignore
		if (Config.isDevelopmentBuild) global.QST = {
			Global,
			Features: this.features,
			Extension: this,
			Config,
		}

		logger("Loaded. " + (+Date.now() - start) + "ms taken")
	}
}
