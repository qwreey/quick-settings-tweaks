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
	duration: number
	override loadSettings(loader: SettingLoader): void {
		this.enabled = loader.loadBoolean("overlay-menu-enabled")
		this.width = loader.loadInt("overlay-menu-width")
		this.duration = loader.loadInt("overlay-menu-animate-duration")
	}
	// #endregion settings

	getCoords(menu: QuickSettingsMenu): {
		outerHeight: number,
		targetHeight: number,
		targetWidth: number,
		sourceX: number,
		sourceY: number,
		sourceHeight: number,
		sourceWidth: number,
		offsetY: number,
		offsetX: number,
	} {
		menu.actor.height = -1
		let [outerHeight] = menu.actor.get_preferred_height(-1)
		const targetWidth = menu.actor.width - menu.box.marginLeft - menu.box.marginRight
		const targetHeight = outerHeight - menu.box.marginTop
		const offsetY = Math.max(
			Math.floor((Global.QuickSettingsBox.height - targetHeight) / 2),
			0
		)
		const sourceX = Math.floor(Global.QuickSettingsGrid.x + menu.sourceActor.x + 0.5)
		const sourceY = Math.floor(Global.QuickSettingsGrid.y + menu.sourceActor.y + 0.5)
		const sourceHeight = Math.floor(menu.sourceActor.height + 0.5)
		const sourceWidth = Math.floor(menu.sourceActor.width + 0.5)
		const offsetX = Math.floor((Global.QuickSettingsBox.width - targetWidth) / 2)
		return {
			outerHeight,
			targetHeight,
			targetWidth,
			sourceX,
			sourceY,
			sourceHeight,
			sourceWidth,
			offsetY,
			offsetX,
		}
	}
	onOpen(_maid: Maid, menu: QuickSettingsMenu, isOpen: boolean) {
		if (!isOpen || !this.duration) menu.actor.set_easing_duration(0)
		else menu.actor.remove_all_transitions()
		if (!isOpen) return

		const coords = this.getCoords(menu)
		this.yconstraint.offset = coords.offsetY

		if (this.duration) {
			menu.box.opacity = 0
			menu.box.ease({
				opacity: 255,
				duration: Math.floor(this.duration / 3),
			})
			menu.box.translationX = Math.floor(coords.sourceX - coords.offsetX + menu.box.marginLeft)
			menu.box.translationY = Math.floor(coords.sourceY - coords.offsetY + menu.box.marginTop)
			menu.box.scaleX = coords.sourceWidth / coords.targetWidth
			menu.box.scaleY = coords.sourceHeight / coords.targetHeight
			menu.box.ease({
				translationX: 0,
				translationY: 0,
				scaleX: 1,
				scaleY: 1,
				mode: Clutter.AnimationMode.EASE_OUT_EXPO,
				duration: this.duration,
			})
		}
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
		this.tracker = null
		Global.QuickSettingsMenu._overlay.get_constraints()[0].enabled = true
		Global.QuickSettingsGrid.layout_manager._overlay.get_constraints()[0].enabled = true
		Global.QuickSettingsMenu._overlay.remove_constraint(this.yconstraint)
	}
}
