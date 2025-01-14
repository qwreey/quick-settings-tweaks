import Gio from "gi://Gio"
import Clutter from "gi://Clutter"

import { Global } from "../global.js"
import { DndIndicator } from "../components/dndQuickToggle.js"
import { FeatureBase, SettingLoader } from "../libs/feature.js"

export class DndQuickToggleFeature extends FeatureBase {
	// #region settings
	enabled: boolean
	override loadSettings(loader: SettingLoader): void {
		this.enabled = loader.loadBoolean("add-dnd-quick-toggle-enabled")
	}
	// #endregion settings

	indicator: DndIndicator
	datemenuDnd: Clutter.Actor
	override onLoad(): void {
		if (!this.enabled) return

		// Create Indicator
		this.maid.destroyJob(
			this.indicator = new DndIndicator()
		)

		// Hide DateMenu DND State Icon
		this.maid.connectJob(Global.DateMenuIndicator, "show", () => Global.DateMenuIndicator.hide())
		this.maid.functionJob(()=>{
			if (!(new Gio.Settings({
				schema_id: "org.gnome.desktop.notifications",
			})).get_boolean("show-banners")) {
				Global.DateMenuIndicator.show()
			}
		})

		// Add to QS
		// @ts-ignore
		Global.QuickSettings.addExternalIndicator(this.indicator)

	}
	override onUnload(): void {
		this.indicator = null
	}
}
