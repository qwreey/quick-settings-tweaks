// Fix https://github.com/qwreey75/quick-settings-tweaks/issues/19
// scrollbar appears over fading-effect
export function fixStScrollViewScrollbarOverflow(stScrollView) {
	let update = () => stScrollView.overlay_scrollbars = !stScrollView.vscrollbar_visible
	stScrollView.connect("notify::vscrollbar-visible", update)
	update()
}

export function logger(str) {
	console.log("[EXTENSION QST] " + str)
}
