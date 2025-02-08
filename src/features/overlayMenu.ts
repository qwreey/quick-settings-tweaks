import Clutter from "gi://Clutter"
import { QuickSlider, type QuickSettingsMenu } from "resource:///org/gnome/shell/ui/quickSettings.js"
import { Global } from "../global.js"
import { FeatureBase, type SettingLoader } from "../libs/feature.js"
import { QuickSettingsMenuTracker } from "../libs/quickSettingsTracker.js"
import Maid from "../libs/maid.js"
import { AdvAni } from "../libs/utility.js"

export class OverlayMenu extends FeatureBase {
	// #region settings
	enabled: boolean
	width: number
	duration: number
	animationStyle: string
	override loadSettings(loader: SettingLoader): void {
		this.enabled = loader.loadBoolean("overlay-menu-enabled")
		this.width = loader.loadInt("overlay-menu-width")
		this.duration = loader.loadInt("overlay-menu-animate-duration")
		this.animationStyle = loader.loadString("overlay-menu-animate-style")
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
		const isSlider = menu.sourceActor instanceof QuickSlider
		const sourceHeight = Math.floor(menu.sourceActor.height + 0.5)
		const sourceBaseWidth = Math.floor(menu.sourceActor.width + 0.5)
		const sourceWidth = isSlider ? sourceHeight : sourceBaseWidth
		const sourceBaseX = Math.floor(Global.QuickSettingsGrid.x + menu.sourceActor.x + 0.5)
		const sourceY = Math.floor(Global.QuickSettingsGrid.y + menu.sourceActor.y + 0.5)
		const sourceX = sourceBaseX + (isSlider ? (sourceBaseWidth - sourceWidth) : 0)
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
			// @ts-expect-error
			menu.box.ease({
				opacity: 255,
				duration: Math.floor(this.duration / 3),
			})
			if (this.animationStyle == "flyout") {
				menu.box.translation_x = Math.floor(coords.sourceX - coords.offsetX + menu.box.marginLeft)
				menu.box.translation_y = Math.floor(coords.sourceY - coords.offsetY + menu.box.marginTop)
				menu.box.scale_x = coords.sourceWidth / coords.targetWidth
				menu.box.scale_y = coords.sourceHeight / coords.targetHeight
				AdvAni.ease(menu.box, {
					translation_x: 0,
					translation_y: 0,
					scale_x: 1,
					scale_y: 1,
					mode: AdvAni.AdvAnimationMode.LowBackover,
					// mode: Clutter.AnimationMode.EASE_OUT_EXPO,
					duration: this.duration,
				})
			} else if (this.animationStyle == "dialog") {
				menu.box.translation_x = 0.2*coords.targetWidth*.5
				menu.box.translation_y = 0.2*coords.targetHeight*.5
				menu.box.scale_x = 0.8
				menu.box.scale_y = 0.8
				AdvAni.ease(menu.box, {
					translation_x: 0,
					translation_y: 0,
					scale_x: 1,
					scale_y: 1,
					mode: AdvAni.AdvAnimationMode.MiddleBackover,
					// mode: Clutter.AnimationMode.EASE_OUT_EXPO,
					duration: this.duration,
				})
			}
		}
	}

	onMenuCreated(maid: Maid, menu: QuickSettingsMenu) {
		menu.actor.get_constraints()[0].enabled = false
		if (this.width) {
			menu.actor.width = this.width
			menu.actor.x_expand = false
		}
		maid.connectJob(menu.box, "notify::height", ()=>{
			if (!menu.isOpen) return
			const coords = this.getCoords(menu)
			this.yconstraint.offset = coords.offsetY
		})
	}

	tracker: QuickSettingsMenuTracker
	yconstraint: Clutter.BindConstraint
	reload(changedKey?: string): void {
		if (changedKey == "overlay-menu-animate-duration") return
		if (changedKey == "overlay-menu-animate-style") return
		super.reload(changedKey)
	}
	override onLoad(): void {
		if (!this.enabled) return

		// Offset handle
		this.yconstraint = new Clutter.BindConstraint({
			coordinate: Clutter.BindCoordinate.Y,
			// @ts-expect-error
			source: Global.QuickSettingsMenu._boxPointer,
		})

		// Disable Y sync (overlay y offset)
		// @ts-expect-error
		Global.QuickSettingsMenu._overlay.get_constraints()[0].enabled = false
		// @ts-expect-error
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
		const tracker = this.tracker
		if (!tracker) return
		this.tracker = null
		for (const menu of tracker.items) {
			menu.actor.x_expand = true
			menu.actor.get_constraints()[0].enabled = true
		}
		tracker.unload()
		// @ts-expect-error
		Global.QuickSettingsMenu._overlay.get_constraints()[0].enabled = true
		// @ts-expect-error
		Global.QuickSettingsGrid.layout_manager._overlay.get_constraints()[0].enabled = true
		// @ts-expect-error
		Global.QuickSettingsMenu._overlay.remove_constraint(this.yconstraint)
	}
}
