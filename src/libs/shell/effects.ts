import GObject from 'gi://GObject'
import Clutter from 'gi://Clutter'
import Cogl from 'gi://Cogl'
import Global from '../../global.js'

// #region RoundClipEffect
export class RoundClipEffect extends Clutter.ShaderEffect {
	static uniforms: RoundClipEffect.Uniforms | null = null

	vfunc_get_static_snippet (): any {
		const [declarations, code] = Global.GetShader("media/rounded_corners.frag")
		const snippet = new (Cogl as any).Snippet((Cogl as any).SnippetHook.FRAGMENT, declarations, code)
		return snippet
	}

	vfunc_paint_target (node: Clutter.PaintNode, ctx: Clutter.PaintContext) {
		// Reset to default blend string.
		const pipeline = (this as any).get_pipeline()
		if (pipeline) {
			pipeline.set_blend('RGBA = ADD(SRC_COLOR, DST_COLOR*(1-SRC_COLOR[A]))')
		}
		super.vfunc_paint_target(node, ctx)
	}

	updateUniforms (
		scale_factor: number,
		corners_cfg: {
			padding?: { left: number, right: number, top: number, bottom: number },
			border_radius: number,
			smoothing: number,
		},
		outer_bounds: { x1: number, x2: number, y1: number, y2: number },
		border?: {
			width: number
			color: [number, number, number, number]
		},
		pixel_step?: [number, number]
	) {
		const border_width = (border?.width ?? 0) * scale_factor
		const border_color = border?.color ?? [0, 0, 0, 0]

		const outer_radius = corners_cfg.border_radius * scale_factor
		const { padding, smoothing } = corners_cfg

		const bounds = [
			outer_bounds.x1 + (padding ? (padding.left * scale_factor) : 0),
			outer_bounds.y1 + (padding ? (padding.top * scale_factor) : 0),
			outer_bounds.x2 - (padding ? (padding.right * scale_factor) : 0),
			outer_bounds.y2 - (padding ? (padding.bottom * scale_factor) : 0),
		]

		const inner_bounds = [
			bounds[0] + border_width,
			bounds[1] + border_width,
			bounds[2] - border_width,
			bounds[3] - border_width,
		]

		let inner_radius = outer_radius - border_width
		if (inner_radius < 0.001) {
			inner_radius = 0.0
		}

		if (!pixel_step) {
			const actor = this.actor
			pixel_step = [1 / actor.get_width (), 1 / actor.get_height ()]
		}

		// Setup with squircle shape
		let exponent = smoothing * 10.0 + 2.0
		let radius = outer_radius * 0.5 * exponent
		const max_radius = Math.min (bounds[2] - bounds[0], bounds[3] - bounds[1])
		if (radius > max_radius) {
			exponent *= max_radius / radius
			radius = max_radius
		}
		inner_radius *= radius / outer_radius

		;(this as any).set_uniform_float('bounds', 4, 4, bounds)
		;(this as any).set_uniform_float('inner_bounds', 4, 4, inner_bounds)
		;(this as any).set_uniform_float('pixel_step', 2, 2, pixel_step)
		;(this as any).set_uniform_float('border_width', 1, 1, [border_width])
		;(this as any).set_uniform_float('exponent', 1, 1, [exponent])
		;(this as any).set_uniform_float('clip_radius', 1, 1, [radius])
		;(this as any).set_uniform_float('border_color', 4, 4, border_color)
		;(this as any).set_uniform_float('inner_clip_radius', 1, 1, [inner_radius])
		this.queue_repaint()
	}
}
GObject.registerClass(RoundClipEffect)
export namespace RoundClipEffect {
	// Uniform location cache
	export class Uniforms {
		bounds = 0
		clip_radius = 0
		exponent = 0
		inner_bounds = 0
		inner_clip_radius = 0
		pixel_step = 0
		border_width = 0
		border_color = 0
	}
}
// #endregion RoundClipEffect
