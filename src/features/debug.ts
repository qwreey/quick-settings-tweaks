import { FeatureBase, type SettingLoader } from "../libs/shell/feature.js"
import Global from "../global.js"
import Logger from "../libs/shared/logger.js"
import Config from "../config.js"

export class DebugFeature extends FeatureBase {
	disableDebugMessage = true

	// #region settings
	expose: boolean
	showLayoutBorder: boolean
	logLevel: number
	loadSettings(loader: SettingLoader): void {
		this.expose = loader.loadBoolean("debug-expose")
		this.showLayoutBorder = loader.loadBoolean("debug-show-layout-border")
		this.logLevel = loader.loadInt("debug-log-level")
	}
	// #endregion settings

	onLoad() {
		Logger.setHeader(Config.loggerPrefix)
		Logger.setLogLevel(this.logLevel)
		Logger.debug(()=>`Logger initialized, LogLevel: ${this.logLevel}`)
		if (this.expose) {
			globalThis.qst = Global
			for (const feature of (Global.Extension as any).features) {
				Global[feature.constructor.name] = feature
			}
			this.maid.functionJob(()=>{
				for (const feature of (Global.Extension as any).features) {
					delete Global[feature.constructor.name]
				}
				delete globalThis.qst
			})
			Logger.debug("Extension environment expose enabled")
		}
		if (this.showLayoutBorder) {
			// @ts-ignore
			Global.QuickSettingsMenu._boxPointer.styleClass += " QSTWEAKS-debug-show-layout"
			this.maid.functionJob(()=>{
				// @ts-ignore
				Global.QuickSettingsMenu._boxPointer.styleClass =
				// @ts-ignore
				Global.QuickSettingsMenu._boxPointer.styleClass.replace(/ QSTWEAKS-debug-show-layout/, "")
			})
			Logger.debug("Show layout border enabled")
		}
	}
	onUnload(): void {}
}
