import St from "gi://St"
import Clutter from "gi://Clutter"
import GObject from "gi://GObject"
import GLib from "gi://GLib"
import Gio from "gi://Gio"
import GdkPixbuf from "gi://GdkPixbuf"
import * as Mpris from "resource:///org/gnome/shell/ui/mpris.js"
import * as MessageList from "resource:///org/gnome/shell/ui/messageList.js"
import { Slider } from "resource:///org/gnome/shell/ui/slider.js"
// @ts-expect-error
import { PageIndicators } from "resource:///org/gnome/shell/ui/pageIndicators.js"
import { Global } from "../../global.js"
import { FeatureBase, type SettingLoader, type Rgb } from "../../libs/feature.js"
import { logger } from "../../libs/logger.js"
import { getImageMeanColor } from "../../libs/imageMeanColor.js"
import { lerp } from "../../libs/utility.js"
import { Drag, Scroll } from "../../libs/drag.js"
import { RoundClipEffect } from "../../libs/roundClip.js"
import * as Main from "resource:///org/gnome/shell/ui/main.js"
import { StyledSlider } from "../../libs/styledSlider.js"
// #region ProgressControl
class ProgressControl extends St.BoxLayout {
	_positionLabel: St.Label
	_lengthLabel: St.Label
	_slider: Slider
	_player: Player
	_positionTracker: number|null
	_dragging: boolean
	_shown: boolean
	_options: ProgressControl.Options

	constructor(player: Player, options: ProgressControl.Options) {
		super(player as any, options as any)
	}
	_init(player: Player, options: ProgressControl.Options): void {
		this._player = player
		this._positionTracker = null
		this._dragging = false
		this._shown = false
		this._options = options

		super._init({
			vertical: false,
			x_expand: true,
			style_class: "QSTWEAKS-progress-control",
		})

		this._createLabels()
		this._createSlider()

		this.add_child(this._positionLabel)
		this.add_child(this._slider)
		this.add_child(this._lengthLabel)

		this.connect("notify::mapped", this._updateTracker.bind(this))
		this.connect("destroy", this._dropTracker.bind(this))
		this._player.connectObject("changed", () => this._updateStatus(), this)
	}

	// Create position, length label
	_createLabels() {
		this._positionLabel = new St.Label({
			y_expand: true,
			y_align: Clutter.ActorAlign.CENTER,
			style_class: "QSTWEAKS-position-label",
		})
		this._lengthLabel = new St.Label({
			y_expand: true,
			y_align: Clutter.ActorAlign.CENTER,
			style_class: "QSTWEAKS-length-label",
		})
	}

	// Create slider and connect drag event
	_createSlider() {
		const oldSlider = this._slider
		const slider = this._slider ??= new Slider(0)

		// Update style
		slider.style = StyledSlider.getStyle(this._options.sliderStyle)
		if (oldSlider) return

		// Process Dragging
		slider.connect("drag-begin", () => {
			this._dragging = true
			return Clutter.EVENT_PROPAGATE
		});
		slider.connect("drag-end", () => {
			this._player.position = (Math.floor(slider.value) * 1000000)
			this._dragging = false
			return Clutter.EVENT_PROPAGATE
		})
		slider.connect("scroll-event", () => {
			return Clutter.EVENT_STOP
		})
		slider.connect("notify::value", () => {
			if (this._dragging) this._updatePosition(Math.floor(slider.value) * 1000000)
		})
	}

	// Show / Hide by playing status
	_updateStatus(noAnimate?: boolean) {
		if (!this.mapped) return
		this._shown = this._player.status === "Playing"
		if (this._shown) this._trackPosition()
		const previousHeight = this.height
		this.height = -1
		const height = this._shown ? this.get_preferred_height(-1)[0] : 0
		this.height = previousHeight
		const opacity = this._shown ? 255 : 0
		if (noAnimate) {
			this.remove_all_transitions()
			this.height = height
			this.opacity = opacity
			return
		}
		if (this._shown) {
			// @ts-expect-error
			this.ease({
				height,
				duration: 150,
				onComplete: ()=>{
					// @ts-expect-error
					this.ease({
						opacity,
						duration: 150,
					})
				}
			})
		} else {
			// @ts-expect-error
			this.ease({
				opacity,
				duration: 200,
				onComplete: ()=>{
					// @ts-expect-error
					this.ease({
						height,
						duration: 150,
					})
				}
			})
		}
	}

	// Update slider and label
	_updatePosition(current: number) {
		const currentSeconds = Math.floor(current / 1000000)
		const lengthSeconds = Math.floor(this._player.length / 1000000)
		this._positionLabel.text = this._formatSeconds(currentSeconds)
		this._lengthLabel.text = this._formatSeconds(lengthSeconds)
		this._slider.overdriveStart = this._slider.maximumValue = lengthSeconds
		this._slider.value = currentSeconds
	}

	// Use polling to update position when only shown
	_trackPosition() {
		this._slider.reactive = this._player.canSeek
		if (this._shown && !this._dragging) {
			this._player.position
				.then(this._updatePosition.bind(this))
				.catch(logger.error)
		}
		return GLib.SOURCE_CONTINUE;
	}
	_dropTracker() {
		if (this._positionTracker === null) return
		GLib.source_remove(this._positionTracker)
		this._positionTracker = null
	}
	_createTracker() {
		this._positionTracker = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, this._trackPosition.bind(this))
		GLib.source_set_name_by_id(
			this._positionTracker,
			"[quick-settings-tweaks] ProgressControl._createTracker: this._positionTracker"
		)
	}
	_updateTracker() {
		if (this.mapped) this._createTracker()
		else this._dropTracker()
		this._updateStatus(true)
	}

	// Seconds => HH:MM:SS or MM:SS
	_formatSeconds(seconds: number) {
		const minutes = Math.floor(seconds / 60) % 60
		const hours = Math.floor(seconds / 3600) % 60
		seconds %= 60

		const secondsPadded = seconds.toString().padStart(2, "0")
		const minutesPadded = minutes.toString().padStart(2, "0")

		if (hours > 0) return `${hours}:${minutesPadded}:${secondsPadded}`
		return `${minutes}:${secondsPadded}`
	}
}
GObject.registerClass(ProgressControl)
namespace ProgressControl {
	export interface OptionsBase {
		sliderStyle: StyledSlider.Options
	}
	export type Options = {
	} & OptionsBase
}
// #endregion ProgressControl

// #region Player
class Player extends Mpris.MprisPlayer {
	_length: number | null
	_propertiesProxy: Gio.DBusProxy
	_seekProxy: Gio.DBusProxy
	_isPropertiesProxyReady: boolean
	_canSeek: boolean
	_trackid: string

	constructor(busName: string) {
		super(busName)

		// Create properties proxy for Position & CanSeek
		const propertiesIface = Global.GetDbusInterface("media/dbus.xml","org.freedesktop.DBus.Properties")
		Gio.DBusProxy.new(
			Gio.DBus.session,
			Gio.DBusProxyFlags.NONE,
			propertiesIface,
			busName,
			"/org/mpris/MediaPlayer2",
			propertiesIface.name,
			null,
		)
		// @ts-expect-error
		.then((proxy: Gio.DbusProxy) => this._propertiesProxy = proxy)
		.catch(logger.error)

		// Create proxy for seeking
		const seekIface = Global.GetDbusInterface("media/dbus.xml","org.mpris.MediaPlayer2.Player")
		Gio.DBusProxy.new(
			Gio.DBus.session,
			Gio.DBusProxyFlags.NONE,
			seekIface,
			busName,
			"/org/mpris/MediaPlayer2",
			seekIface.name,
			null,
		)
		// @ts-expect-error
		.then((proxy: Gio.DbusProxy) => this._seekProxy = proxy)
		.catch(logger.error)
	}

	get position(): Promise<number|null> {
		return this._propertiesProxy.GetAsync(
			"org.mpris.MediaPlayer2.Player",
			"Position"
		).then((result: any) => {
			return result[0].get_int64()
		}).catch(()=> null)
	}
	set position(value: number) {
		this._seekProxy.SetPositionAsync(
			this.trackId,
			Math.min(this.length, Math.max(1, value))
		).catch(logger.error)
	}
	get trackId(): string {
		return this._trackid
	}
	get canSeek(): boolean {
		return this._canSeek
	}
	get length(): number|null {
		return this._length
	}
	_updateState() {
		this._trackid = null
		this._length = null
		try {
			const metadata = (this as any)._playerProxy.Metadata
			this._trackid = metadata?.["mpris:trackid"]?.get_string()[0]
			this._length = metadata?.["mpris:length"]?.get_int64() ?? null
		} catch {}

		this._propertiesProxy.GetAsync(
			"org.mpris.MediaPlayer2.Player",
			"CanSeek"
		).catch(()=>{
			this._canSeek = false
		}).then((result: any) => {
			this._canSeek = result[0].get_boolean()
		}).catch(()=>{
			this._canSeek = false
		}).finally(()=>{
			if (this._propertiesProxy) super._updateState()
		})
	}

	_close() {
		this._propertiesProxy = null
		this._seekProxy = null
		super._close()
	}
}
// #endregion Player

// #region MediaItem
class MediaItem extends Mpris.MediaMessage {
	_player: Player
	_cachedColors: Map<string, Promise<void | [number, number, number]>>
	_options: MediaItem.Options
	_progressControl?: ProgressControl

	constructor(player: Player, options: MediaItem.Options) {
		super(player)
		this._options = options
		if (options.progressEnabled) {
			this.child.add_child(
				this._progressControl = new ProgressControl(player, options)
			)
		}
		this._updateControlOpacity()
		this._updateGradient()
	}
	protected _onDestroy(): void {
		this._cachedColors = null
		super._onDestroy()
	}
	_updateGradient(): void {
		if (!this._options?.gradientEnabled) {
			this.style = ""
			return
		}
		this._cachedColors ??= new Map()
		const coverUrl = this._player.trackCoverUrl
		if (!coverUrl || coverUrl.endsWith(".svg")) return
		const coverPath = coverUrl.replace(/^file:\/\//,"")
		let colorTask = this._cachedColors.get(coverPath)
		if (!colorTask) {
			const pixbuf = GdkPixbuf.Pixbuf.new_from_file(coverPath)
			if (!pixbuf) return
			colorTask = getImageMeanColor(pixbuf)
			this._cachedColors.set(coverPath, colorTask)
		}
		colorTask.then(color=>{
			if (!color) return
			if (!this._cachedColors) return
			const mixStart = this._options.gradientStartMix / 1000
			const mixEnd = this._options.gradientEndMix / 1000
			const [bgr, bgg, bgb] = this._options.gradientBackground
			const [r,g,b] = color
			this.style =
				`background-gradient-direction:horizontal;background-gradient-start:rgba(${
					lerp(bgr, r, mixStart)
				},${
					lerp(bgg, g, mixStart)
				},${
					lerp(bgb, b, mixStart)
				},${
					this._options.gradientStartOpaque/1000
				});background-gradient-end:rgba(${
					lerp(bgr, r, mixEnd)
				},${
					lerp(bgg, g, mixEnd)
				},${
					lerp(bgb, b, mixEnd)
				},${
					this._options.gradientEndOpaque/1000
				});`
		})
	}
	_updateControlOpacity() {
		this._nextButton.opacity =
		this._prevButton.opacity =
		this._playPauseButton.opacity = this._options.contorlOpacity
	}
	protected _update(): void {
		super._update()
		this._updateGradient()
	}

	// Pass all gesture actions to the parent
	vfunc_button_press_event(_event: Clutter.Event): boolean {
		return Clutter.EVENT_PROPAGATE
	}
	vfunc_button_release_event(_event: Clutter.Event): boolean {
		return Clutter.EVENT_PROPAGATE
	}
	vfunc_motion_event(_event: Clutter.Event): boolean {
		return Clutter.EVENT_PROPAGATE
	}
	vfunc_touch_event(_event: Clutter.Event): boolean {
		return Clutter.EVENT_PROPAGATE
	}
}
GObject.registerClass(MediaItem)
namespace MediaItem {
	export interface OptionsBase {
		progressEnabled: boolean
		gradientBackground: Rgb
		gradientStartOpaque: number
		gradientStartMix: number
		gradientEndOpaque: number
		gradientEndMix: number
		gradientEnabled: boolean
		contorlOpacity: number
	}
	export type Options = {
	}
		& OptionsBase
		& ProgressControl.OptionsBase
}
// #endregion MediaItem

// #region MediaList
class MediaList extends ((Mpris.MediaSection || (MessageList as any).MediaSection) as typeof Mpris.MediaSection) {
	_options: MediaList.Options
	_messages: MediaItem[]
	_current?: MediaItem
	_currentMaxPage: number
	_currentPage: number
	_effect?: RoundClipEffect
	_drag: boolean
	_scroll: boolean
	_dragTranslation?: number

	constructor(options: MediaList.Options) {
		// @ts-ignore
		super(options)
	}
	// @ts-ignore
	_init(options: MediaList.Options): void {
		super._init()
		this._current = null
		this._options = options
		this._currentMaxPage = 0
		this._currentPage = 0
		this._drag = false

		// St props
		this.can_focus = true
		this.reactive = true
		this.track_hover = true
		this.hover = false

		// Round clip effect
		this._initEffect()
		this.connect("notify::height", this._updateEffect.bind(this))
		this.connect("notify::width", this._updateEffect.bind(this))

		// Scroll Event
		this.connect("scroll-event", (_: Clutter.Actor, event: Clutter.Event) => {
			if (this._drag) return
			const direction = event.get_scroll_direction()
			if (direction === Clutter.ScrollDirection.UP) {
				this._seekPage(-1)
			}
			if (direction === Clutter.ScrollDirection.DOWN) {
				this._seekPage(1)
			}
		})
	}

	// Round clip effect
	_initEffect() {
		// Disabled
		if (!this._options.roundClipEnabled) {
			if (this._effect) {
				this.remove_effect_by_name("round-clip")
			}
			this._effect = null
			return
		}

		// Enabled
		const effect = this._effect = new RoundClipEffect()
		effect.enabled = false
		this.add_effect_with_name("round-clip", effect)
		effect.connect("notify::enabled", ()=>{
			if (effect !== this._effect) return
			if (effect.enabled) this._updateEffect()
		})
		this._updateEffect()
	}
	_updateEffect() {
		if (!this._effect) return
		if (!this.get_stage()) return
		const themeNode = this.mapped ? this._current?.get_theme_node() : null
		const padding = this._options.roundClipPadding
		this._effect.update_uniforms(1, {
			border_radius: themeNode?.get_border_radius(null) ?? 16,
			smoothing: 0,
		},{
			x1: padding?.[3] ?? 2,
			y1: padding?.[0] ?? 3,
			x2: this.width - (padding?.[1] ?? 2),
			y2: this.height - (padding?.[2] ?? 2)
		})
	}

	// Handle dragging
	_updateDragOffset(current: MediaItem, offset: number) {
		const sign = Math.sign(offset)
		const width = current.allocation.get_width()
		const ratio = Math.max(Math.min(offset / width, 1), -1)
		const halfRatio = Math.max(Math.min(offset * 0.5 / width, 1), -1)
		const expoRatio = (1 - Math.pow(1 - Math.abs(halfRatio), 4)) * sign
		current.remove_all_transitions()
		this._dragTranslation = current.translationX = expoRatio * (width * 0.6)
		current.opacity = Math.floor(lerp(255, 80, Math.abs(ratio)))
	}
	_finalizeDragOffset(current: MediaItem, offset: number) {
		const width = current.allocation.get_width()
		const direction = -Math.sign(offset)

		if (
			(this._currentPage == this._currentMaxPage - 1 && direction == 1)
			|| (this._currentPage == 0 && direction == -1)
			|| (width/4 > Math.abs(offset))
		) {
			// @ts-expect-error
			current.ease({
				mode: Clutter.AnimationMode.EASE_OUT_EXPO,
				translationX: 0,
				duration: 360,
				opacity: 255,
				onComplete: ()=>{
					if (this._effect) this._effect.enabled = false
				}
			})
			this._dragTranslation = null
			return
		}
		this._seekPage(direction)
		this._dragTranslation = null
	}
	dfunc_drag_end(event: Drag.Event): void {
		this._drag = false
		const current = this._current
		if (!current || this._scroll) {
			this._dragTranslation = null
			return
		}
		if (event.isClick) {
			Main.overview.hide()
			Main.panel.closeQuickSettings()
			current._player?.raise()
		}

		const offset = event.coords[0] - (event.moveStartCoords || event.startCoords)[0]
		this._finalizeDragOffset(current, offset)
	}
	dfunc_drag_start(_event: Drag.Event): void {
		if (this._scroll) return
		this._drag = true
		this._dragTranslation = 0
		if (this._effect) this._effect.enabled = true
	}
	dfunc_drag_motion(event: Drag.Event): void {
		if (this._scroll) return
		const current = this._current
		if (event.isClick || !current) return
		const offset = event.coords[0] - event.moveStartCoords[0]
		this._updateDragOffset(current, offset)
	}

	// Handle smooth scrolling
	dfunc_scroll_start(_event: Scroll.Event): void {
		if (this._drag) return
		this._scroll = true
		this._dragTranslation = 0
		if (this._effect) this._effect.enabled = true
	}
	dfunc_scroll_motion(event: Scroll.Event): void {
		if (this._drag) return
		const current = this._current
		if (!current) return
		this._updateDragOffset(current, -event.scrollSumX * this._options.smoothScrollSpeed)
	}
	dfunc_scroll_end(event: Scroll.Event): void {
		this._scroll = false
		const current = this._current
		if (!current || this._drag) {
			this._dragTranslation = null
			return
		}
		this._finalizeDragOffset(current, -event.scrollSumX * this._options.smoothScrollSpeed)
	}

	// Handle page action
	get page(): number {
		return this._currentPage
	}
	set page(page: number) {
		this._setPage(this._messages[page])
	}
	get maxPage(): number {
		return this._currentMaxPage
	}
	_showFirstPlaying() {
		// Show first playing message
		const messages = this._messages
		this._setPage(
			messages.find(message => message?._player.status === "Playing")
			?? messages[0]
		)
	}
	_setPage(to: MediaItem) {
		const current = this._current
		const messages = this._messages
		this._current = to
		if (!to || to == current) return
		for (const message of messages) {
			message.remove_all_transitions()
			if (message == current) continue
			message.hide()
		}
		const toIndex = messages.findIndex(message => message == to)
		this._currentPage = toIndex
		this.emit("page-updated", toIndex)
		if (!current) {
			to.show()
			return
		}
		const currentIndex = messages.findIndex(message => message == current)

		if (this._effect) this._effect.enabled = true
		// @ts-expect-error
		current.ease({
			opacity: 0,
			translationX: (toIndex > currentIndex ? -120 : 120) + (this._dragTranslation ?? 0),
			duration: 100,
			mode: Clutter.AnimationMode.EASE_OUT_QUAD,
			onComplete: ()=>{
				current.hide()
				to.opacity = 0
				to.translationX = toIndex > currentIndex ? 120 : -120
				to.show()
				// @ts-expect-error
				to.ease({
					mode: Clutter.AnimationMode.EASE_OUT_EXPO,
					duration: 280,
					translationX: 0,
					opacity: 255,
					onStopped: ()=>{
						if (this._effect) this._effect.enabled = false
						if (!this._messages.includes(to)) return
						to.opacity = 255
						to.translationX = 0
					}
				})
			},
			onStopped: ()=>{
				if (!this._messages.includes(current)) return
				current.opacity = 255
				current.translationX = 0
			}
		})
	}
	_seekPage(offset: number) {
		const messages = this._messages
		if (this._current === null) return
		let currentIndex = messages.findIndex(message => message == this._current)
		if (currentIndex == -1) currentIndex = 0
		const length = messages.length
		this._setPage(messages[((currentIndex + offset + length) % length)])
	}

	// New message / Remove message
	_sync() {
		// @ts-expect-error
		super._sync()
		const messages = this._messages

		// Emit max page update
		if (this._currentMaxPage != messages.length) {
			this.emit("max-page-updated",
				this._currentMaxPage = messages.length
			)
		}

		// Current message destroyed
		if (this._current && (this.empty || !messages.includes(this._current))) {
			this._current = null
		}

		// Hide new message
		for (const message of messages) {
			if (message == this._current) continue
			message.hide()
		}

		// Show first playing message if nothing shown
		if (!this._current) {
			this._showFirstPlaying()
		}
	}

	// Override for custom message and player
	// See: https://github.com/GNOME/gnome-shell/blob/c58b826788f99bc783c36fa44e0e669dee638f0e/js/ui/mpris.js#L264
	_addPlayer(busName: string) {
		if (this._players.get(busName))
			return

		let player = new Player(busName)
		let message = null
		player.connect("closed",() => {
			this._players.delete(busName)
			return false
		})
		player.connect("show", () => {
			message = new MediaItem(player, this._options)
			this.addMessage(message, true)
			return false
		})
		player.connect("hide", () => {
			this.removeMessage(message, true)
			message = null
			return false
		})

		this._players.set(busName, player)
	}
}
Drag.applyTo(MediaList)
Scroll.applyTo(MediaList)
GObject.registerClass({
	Signals: {
		"page-updated": {param_types: [GObject.TYPE_INT]},
		"max-page-updated": {param_types: [GObject.TYPE_INT]},
	}
}, MediaList)
namespace MediaList {
	export type Options = Partial<{
		roundClipEnabled: boolean,
		roundClipPadding: null|[number, number, number, number],
		smoothScrollSpeed: number,
	} & St.BoxLayout.ConstructorProps>
		& MediaItem.OptionsBase
		& ProgressControl.OptionsBase
}
// #endregion MediaList

// #region Header
class Header extends St.BoxLayout {
	_headerLabel: St.Label
	_pageIndicator: St.BoxLayout

	constructor(options: Header.Options) {
		super(options)
	}
	_init(options: Header.Options) {
		super._init({
			style_class: "QSTWEAKS-header"
		} as Partial<St.BoxLayout.ConstructorProps>)

		// Label
		this._headerLabel = new St.Label({
			text: _("Media"),
			style_class: "QSTWEAKS-header-label",
			y_align: Clutter.ActorAlign.CENTER,
			x_align: Clutter.ActorAlign.START,
			x_expand: true
		})
		this.add_child(this._headerLabel)

		this._pageIndicator = new PageIndicators(Clutter.Orientation.HORIZONTAL)
		this._pageIndicator.x_align = Clutter.ActorAlign.END
		this._pageIndicator.connect("page-activated", (_, page) => this.emit("page-activated", page))
		this._pageIndicator.y_align = Clutter.ActorAlign.CENTER
		this.add_child(this._pageIndicator)
	}

	set maxPage(maxPage: number) {
		(this._pageIndicator as any).setNPages(maxPage)
	}
	get maxPage(): number {
		return (this._pageIndicator as any).nPages
	}
	set page(page: number) {
		(this._pageIndicator as any).setCurrentPosition(page)
	}
	get page(): number {
		return (this._pageIndicator as any)._currentPosition
	}
}
GObject.registerClass({
	Signals: {
		"page-activated": {param_types: [GObject.TYPE_INT]},
	}
}, Header)
namespace Header {   
	export type Options = Partial<{
	} & St.BoxLayout.ConstructorProps>
}
// #endregion Header

// #region MediaWidget
class MediaWidget extends St.BoxLayout {
	_options: MediaWidget.Options
	_scroll: St.ScrollView
	_list: MediaList
	_header: Header
	_sections: St.BoxLayout

	constructor(options: MediaWidget.Options) {
		super(options)
	}
	_init(options: MediaWidget.Options) {
		super._init({
			vertical: true,
			x_expand: true,
			y_expand: true,
			reactive: true,
		} as Partial<St.BoxLayout.ConstructorProps>)
		this._options = options
		this._updateStyleClass()

		// Create header
		this._header = new Header({})
		this.add_child(this._header)

		// Create list
		this._list = new MediaList(options)
		this.add_child(this._list)
		this._list.connect("notify::empty", this._syncEmpty.bind(this))
		this._syncEmpty()

		// Sync page update & page indicator
		this._header.page = this._list.page
		this._header.maxPage = this._list.maxPage
		const pageConnection = this._list.connect("page-updated", (_, page: number): void => {
			if (this._header.page == page) return
			this._header.page = page
		})
		const maxPageConnection = this._list.connect("max-page-updated", (_, maxPage: number): void => {
			if (this._header.maxPage == maxPage) return
			this._header.maxPage = maxPage
		})
		this._header.connect("page-activated", (_, page: number) => {
			this._list.page = page
		})
		this.connect("destroy", ()=>{
			this._list.disconnect(pageConnection)
			this._list.disconnect(maxPageConnection)
		})
	}

	_syncEmpty() {
		this.visible = !this._list.empty
	}

	_updateStyleClass() {
		const options = this._options
		let style = "QSTWEAKS-media"
		if (options.compact) style += " QSTWEAKS-message-compact"
		if (options.removeShadow) style += " QSTWEAKS-message-remove-shadow"
		this.style_class = style
	}
}
GObject.registerClass(MediaWidget)
namespace MediaWidget {
	export type Options = Partial<{
		compact: boolean
		removeShadow: boolean
	} & St.BoxLayout.ConstructorProps>
		& MediaItem.OptionsBase
		& ProgressControl.OptionsBase
}
// #endregion MediaWidget

// #region MediaWidgetFeature
export class MediaWidgetFeature extends FeatureBase {
	// #region settings
	enabled: boolean
	header: boolean
	compact: boolean
	removeShadow: boolean
	progressEnabled: boolean
	sliderStyle: StyledSlider.Options
	gradientBackground: Rgb
	gradientStartOpaque: number
	gradientStartMix: number
	gradientEndOpaque: number
	gradientEndMix: number
	gradientEnabled: boolean
	contorlOpacity: number
	roundClipEnabled: boolean
	roundClipPadding: null|[number, number, number, number]
	smoothScrollSpeed: number
	override loadSettings(loader: SettingLoader): void {
		this.enabled = loader.loadBoolean("media-enabled")
		this.header = loader.loadBoolean("media-show-header")
		this.compact = loader.loadBoolean("media-compact")
		this.removeShadow = loader.loadBoolean("media-remove-shadow")
		this.contorlOpacity = loader.loadInt("media-contorl-opacity")
		this.smoothScrollSpeed = loader.loadInt("media-smooth-scroll-speed")

		// Gradient
		this.gradientBackground = loader.loadRgb("media-gradient-background-color")!
		this.gradientEnabled = loader.loadBoolean("media-gradient-enabled")
		this.gradientStartOpaque = loader.loadInt("media-gradient-start-opaque")
		this.gradientStartMix = loader.loadInt("media-gradient-start-mix")
		this.gradientEndOpaque = loader.loadInt("media-gradient-end-opaque")
		this.gradientEndMix = loader.loadInt("media-gradient-end-mix")
		
		// Progress
		this.progressEnabled = loader.loadBoolean("media-progress-enabled")
		this.sliderStyle = StyledSlider.Options.fromLoader(loader, "media-progress")

		// Round clip
		this.roundClipEnabled = loader.loadBoolean("media-round-clip-enabled")
		const roundClipPaddingValue = loader.loadValue("media-round-clip-padding-adjustment-value")
		const roundClipPaddingEnabled = loader.loadBoolean("media-round-clip-padding-adjustment-enabled")
		this.roundClipPadding = (roundClipPaddingEnabled ? roundClipPaddingValue : null) as any
	}
	// #endregion settings

	mediaWidget?: MediaWidget
	override reload(key: string): void {
		// Slider style
		if (StyledSlider.Options.isStyleKey("media-progress", key)) {
			if (!this.enabled) return
			if (!this.progressEnabled) return
			for (const message of this.mediaWidget!._list._messages) {
				message._progressControl!._createSlider()
			}
			return
		}

		switch (key) {
			case "media-compact":
			case "media-remove-shadow":
				if (!this.enabled) return
				this.mediaWidget!._updateStyleClass()
				break
			// Round clip
			case "media-round-clip-enabled":
				if (!this.enabled) return
				this.mediaWidget!._list._initEffect()
				break
			// Scroll speed
			case "media-smooth-scroll-speed":
				break
			// Round clip padding
			case "media-round-clip-padding-adjustment-value":
			case "media-round-clip-padding-adjustment-enabled":
				break
			// Control opacity
			case "media-contorl-opacity":
				if (!this.enabled) return
				for (const message of this.mediaWidget!._list._messages) {
					message._updateControlOpacity()
				}
				break
			// Gradient
			case "media-gradient-background-color":
			case "media-gradient-enabled":
			case "media-gradient-start-opaque":
			case "media-gradient-start-mix":
			case "media-gradient-end-opaque":
			case "media-gradient-end-mix":
				if (!this.enabled) return
				for (const message of this.mediaWidget!._list._messages) {
					message._updateGradient()
				}
				break
			default:
				super.reload()
				break
		}
	}
	override onLoad(): void {
		if (!this.enabled) return
		this.maid.destroyJob(
			this.mediaWidget = new MediaWidget(this)
		)

		Global.QuickSettingsGrid.add_child(this.mediaWidget)
		Global.QuickSettingsGrid.layout_manager.child_set_property(
			Global.QuickSettingsGrid, this.mediaWidget, "column-span", 2
		)
	}
	override onUnload(): void {
		this.mediaWidget = null
	}
}
// #endregion MediaWidgetFeature
