import Clutter from "gi://Clutter"
import { type QuickSettingsMenu } from "resource:///org/gnome/shell/ui/quickSettings.js"
import { Global } from "../global.js"
import { FeatureBase, SettingLoader } from "../libs/feature.js"
import QuickSettingsMenuTracker from "../libs/quickSettingsMenuTracker.js"
import Maid from "../libs/maid.js"

export class OverlayMenu extends FeatureBase {
	// #region settings
	enabled: boolean
	width: number
	override loadSettings(loader: SettingLoader): void {
		this.enabled = loader.loadBoolean("overlay-menu-enabled")
		this.width = loader.loadInt("overlay-menu-width")
	}
	// #endregion settings

	onOpen(_maid: Maid, menu: QuickSettingsMenu, isOpen: boolean) {
		menu.actor.set_easing_duration(0)
		if (!isOpen) return

		const previousHeight = menu.actor.height
		menu.actor.height = -1
		const [targetHeight] = menu.actor.get_preferred_height(-1)
		menu.actor.height = previousHeight
		this.yconstraint.offset = Math.max(
			Math.floor((Global.QuickSettingsBox.height - targetHeight) / 2),
			0
		)
	}

	onMenuCreated(_maid: Maid, menu: QuickSettingsMenu) {
		menu.actor.get_constraints()[0].enabled = false
		if (this.width) {
			menu.actor.width = this.width
			menu.actor.x_expand = false
		}
	}

	tracker: QuickSettingsMenuTracker
	yconstraint: Clutter.BindConstraint
	override onLoad(): void {
		if (!this.enabled) return

		// Offset handle
		this.yconstraint = new Clutter.BindConstraint({
			coordinate: Clutter.BindCoordinate.Y,
			source: Global.QuickSettingsMenu._boxPointer,
		})

		// Disable Y sync (overlay y offset)
		// @ts-expect-error
		Global.QuickSettingsMenu._overlay.get_constraints()[0].enabled = false
		Global.QuickSettingsMenu._overlay.add_constraint(this.yconstraint)

		// Disable Placeholder height sync (grid height increase)
		// @ts-expect-error
		Global.QuickSettingsGrid.layout_manager._overlay.get_constraints()[0].enabled = false

		this.tracker = new QuickSettingsMenuTracker()
		this.tracker.onMenuCreated = this.onMenuCreated.bind(this)
		this.tracker.onOpen = this.onOpen.bind(this)
		this.tracker.load()
	}
	override onUnload(): void {
		if (!this.tracker) return
		for (const menu of this.tracker.menus) {
			menu.actor.x_expand = true
			menu.actor.get_constraints()[0].enabled = true
		}
		this.tracker.unload()
		Global.QuickSettingsMenu._overlay.get_constraints()[0].enabled = true
		Global.QuickSettingsGrid.layout_manager._overlay.get_constraints()[0].enabled = true
		Global.QuickSettingsMenu._overlay.remove_constraint(this.yconstraint)
	}
}
