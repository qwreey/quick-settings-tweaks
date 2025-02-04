import { Rgba, type SettingLoader } from "./feature"

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
	}
}
