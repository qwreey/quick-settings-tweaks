import Clutter from "gi://Clutter"
import Graphene from "gi://Graphene"

// Gnome base ease function params
export interface EasingParams {
    repeatCount?: number
    autoReverse?: boolean
    animationRequired?: boolean
    duration?: number
    delay?: number
    mode?: Clutter.AnimationMode | any
    [key: string]: any
}

// AdvAni ease function params
export interface AdvEasingParams extends EasingParams {
    mode: Clutter.AnimationMode | AdvAnimationMode,
}

// AdvAni ease mode define type
export interface ModeDefineIface {
    mode: Clutter.AnimationMode
    getCubicBezierProgress?: ()=>[Graphene.Point, Graphene.Point]
    cubicBezierProgress?: [Graphene.Point, Graphene.Point]
}
export interface ModeDefine extends ModeDefineIface {}
export class ModeDefine {
    constructor(params: ModeDefineIface) {
        for (const [key, value] of Object.entries(params)) {
            this[key] = value
        }
    }
}

// Utility functions
export function createBezier(
    x1: number, y1: number, x2: number, y2: number
):[Graphene.Point, Graphene.Point] {
    return [
        new Graphene.Point({ x: x1, y: y1 }),
        new Graphene.Point({ x: x2, y: y2 })
    ]
}

// Template AdvAni animations
export enum AdvAnimationMode {
    LowBackover = 2000,
    MiddleBackover = 2001,
}
export const AdvAnimationModeDefines = [
    new ModeDefine({
        mode: Clutter.AnimationMode.CUBIC_BEZIER,
        getCubicBezierProgress: ()=>createBezier(.225,1.2,.45,1)
    }),
    new ModeDefine({
        mode: Clutter.AnimationMode.CUBIC_BEZIER,
        getCubicBezierProgress: ()=>createBezier(.4,1.35,.55,1)
    }),
] as ModeDefine[]

// Main AdvAni ease function
export function ease(actor: Clutter.Actor, params: AdvEasingParams) {
    // Get mode defines
    let modeDefine: ModeDefine|null
    if (params.mode && params.mode > Clutter.AnimationMode.ANIMATION_LAST) {
        modeDefine = AdvAnimationModeDefines[params.mode - AdvAnimationMode.LowBackover]
        params.mode = modeDefine.mode
    } else if ((typeof params.mode == "object") && ((params.mode as any) instanceof ModeDefine)) {
        modeDefine = params.mode
        params.mode = modeDefine.mode
    }

    // Run gnome ease function
    // @ts-expect-error
    actor.ease(params)
    if (!modeDefine) return

    // Adjust bezier progress if option exist
    let { getCubicBezierProgress, cubicBezierProgress } = modeDefine
    if (getCubicBezierProgress) cubicBezierProgress = getCubicBezierProgress()
    if (cubicBezierProgress) {
        for (const key in params) {
            const transition = actor.get_transition(key.replace(/_/g, '-'))
            if (!transition) continue
            transition.set_cubic_bezier_progress(...cubicBezierProgress)
        }
    }
}
