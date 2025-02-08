import Clutter from "gi://Clutter"
import Graphene from "gi://Graphene"
import { type PopupMenuBase, PopupSeparatorMenuItem } from "resource:///org/gnome/shell/ui/popupMenu.js"

export function lerp(init: number, target: number, ratio: number) {
	return (target - init) * ratio + init
}

export function updateMenuSeparators(menu: PopupMenuBase) {
	for (const item of (menu as any)._getMenuItems()) {
		if (!(item instanceof PopupSeparatorMenuItem)) {
			continue
		}
		(menu as any)._updateSeparatorVisibility(item)
	}
}

export namespace AdvAni {
	export interface EasingParams {
		repeatCount?: number
		autoReverse?: boolean
		animationRequired?: boolean
		duration?: number
		delay?: number
		mode?: Clutter.AnimationMode | any
		[key: string]: any
	}
	export interface AdvEasingParams extends EasingParams {
		mode: Clutter.AnimationMode | AdvAnimationMode,
	}
	export interface ModeDefineIface {
		mode: Clutter.AnimationMode
		cubicBezierProgress?: ()=>[Graphene.Point, Graphene.Point]
	}
	export interface ModeDefine extends ModeDefineIface {}
	export class ModeDefine {
		constructor(params: ModeDefineIface) {
			for (const [key, value] of Object.entries(params)) {
				this[key] = value
			}
		}
	}
	export enum AdvAnimationMode {
		LowBackover = 2000,
		MiddleBackover = 2001,
	}
	export function createBezier(
		x1: number, y1: number, x2: number, y2: number
	):[Graphene.Point, Graphene.Point] {
		return [
			new Graphene.Point({ x: x1, y: y1 }),
			new Graphene.Point({ x: x2, y: y2 })
		]
	}
	export const AdvAnimationModeDefines = [
		new ModeDefine({
			mode: Clutter.AnimationMode.CUBIC_BEZIER,
			cubicBezierProgress: ()=>createBezier(.225,1.2,.45,1)
		}),
		new ModeDefine({
			mode: Clutter.AnimationMode.CUBIC_BEZIER,
			cubicBezierProgress: ()=>createBezier(.4,1.35,.55,1)
		}),
	] as ModeDefine[]
	export function ease(actor: Clutter.Actor, params: AdvEasingParams) {
		let modeDefine: ModeDefine|null
		if (params.mode && params.mode > Clutter.AnimationMode.ANIMATION_LAST) {
			modeDefine = AdvAnimationModeDefines[params.mode - AdvAnimationMode.LowBackover]
			params.mode = modeDefine.mode
		} else if ((typeof params.mode == "object") && ((params.mode as any) instanceof ModeDefine)) {
			modeDefine = params.mode
			params.mode = modeDefine.mode
		}
		// @ts-expect-error
		actor.ease(params)
		if (!modeDefine) return
		const { cubicBezierProgress } = modeDefine
		if (cubicBezierProgress) {
			for (const key in params) {
				const transition = actor.get_transition(key.replace(/_/g, '-'))
				if (!transition) continue
				transition.set_cubic_bezier_progress(...cubicBezierProgress())
			}
		}
	}
}
