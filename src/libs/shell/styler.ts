import St from "gi://St"
import { type SettingLoader } from "./feature.js"
import { Rgba } from "../shared/colors.js"

export namespace StyledSlider {
	export interface Options {
		style: "slim" | "default"
		activeBackgroundColor: Rgba | null
		handleRadius: number
		handleColor: Rgba | null
		backgroundColor: Rgba | null
		height: number
	}
	export function getStyle(options: Options): string {
		const {
			style,
			activeBackgroundColor,
			handleRadius,
			handleColor,
			backgroundColor,
			height,
		} = options
		const styleList = []
		switch (style) {
			case "slim":
				styleList.push("-slider-handle-radius:0px")
				if (activeBackgroundColor) {
					styleList.push("color:"+Rgba.formatCss(activeBackgroundColor))
				} else {
					styleList.push("color:-st-accent-color")
				}
				break
			case "default":
			default:
				if (handleRadius) {
					styleList.push(`-slider-handle-radius:${handleRadius}px`)
				}
				if (handleColor) {
					styleList.push(`color:${Rgba.formatCss(handleColor)}`)
				}
				break
		}
		if (height) styleList.push(`-barlevel-height:${height}px`)
		if (activeBackgroundColor) styleList.push(
			`-barlevel-active-background-color:${Rgba.formatCss(activeBackgroundColor)}`
		)
		if (backgroundColor) styleList.push(
			`-barlevel-background-color:${Rgba.formatCss(backgroundColor)}`
		)
		const result = styleList.join(";")
		return result
	}
	export namespace Options {
		export function fromLoader(loader: SettingLoader, prefix: string): Options {
			return {
				style: loader.loadString(prefix+"-style") as Options["style"],
				handleColor: loader.loadRgba(prefix+"-handle-color"),
				handleRadius: loader.loadInt(prefix+"-handle-radius"),
				backgroundColor: loader.loadRgba(prefix+"-background-color"),
				height: loader.loadInt(prefix+"-height"),
				activeBackgroundColor: loader.loadRgba(prefix+"-active-background-color"),
			}
		}
		export function isStyleKey(prefix: string, key: string): boolean {
			if (key == prefix + "-style") return true
			if (key == prefix + "-handle-color") return true
			if (key == prefix + "-handle-radius") return true
			if (key == prefix + "-background-color") return true
			if (key == prefix + "-height") return true
			if (key == prefix + "-active-background-color") return true
			return false
		}
	}
}

export namespace StyledScroll {
	export interface Options {
		showScrollbar: boolean
		fadeOffset: number
	}
	export function updateStyle(scroll: St.ScrollView, options: Options) {
		scroll.style_class =
			options.fadeOffset
			? "vfade"
			: ""
		scroll.vscrollbar_policy =
			options.showScrollbar
			? St.PolicyType.AUTOMATIC
			: St.PolicyType.EXTERNAL
		scroll.style =
			options.fadeOffset
			? `-st-vfade-offset:${options.fadeOffset}px;`
			: ""
	}
	export namespace Options {
		export function fromLoader(loader: SettingLoader, prefix: string): Options {
			return {
				showScrollbar: loader.loadBoolean(prefix+"-show-scrollbar"),
				fadeOffset: loader.loadInt(prefix+"-fade-offset"),
			}
		}
	}
}
