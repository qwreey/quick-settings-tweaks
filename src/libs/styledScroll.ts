import St from "gi://St"

export namespace StyledScroll {
	export interface Options {
		scrollbar: boolean
		fadeOffset: number
	}
	export function updateStyle(scroll: St.ScrollView, options: Options) {
		scroll.style_class =
			options.fadeOffset
			? "vfade"
			: ""
		scroll.vscrollbar_policy =
			options.scrollbar
			? St.PolicyType.AUTOMATIC
			: St.PolicyType.EXTERNAL
		scroll.style =
			options.fadeOffset
			? `-st-vfade-offset: ${options.fadeOffset}px;`
			: ""
	}
}
