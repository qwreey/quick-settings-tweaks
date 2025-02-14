/*
 * This code is partially licensed under the gnome-volume-mixer license.
 * For more details, please check the license page in the about tab of the extension settings.
*/
import St from "gi://St"
import Gvc from "gi://Gvc"
import GObject from "gi://GObject"
import Gio from "gi://Gio"
import GLib from "gi://GLib"
import { QuickSlider } from "resource:///org/gnome/shell/ui/quickSettings.js"
import * as Main from "resource:///org/gnome/shell/ui/main.js"
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js"
import * as Volume from "resource:///org/gnome/shell/ui/status/volume.js"
import { FeatureBase, type SettingLoader } from "../../libs/shell/feature.js"
import { StyledScroll } from "../../libs/shell/styler.js"
import { updateMenuSeparators } from "../../libs/shell/quickSettingsUtils.js"
import Maid from "../../libs/shared/maid.js"
import Global from "../../global.js"
import Logger from "../../libs/shared/logger.js"

const ALLOW_AMPLIFIED_VOLUME_KEY = 'allow-volume-above-100-percent'

// #region StreamSlider
class StreamSlider extends QuickSlider {
	_maid: Maid
	_control: Gvc.MixerControl
	_inDrag: boolean
	_notifyVolumeChangeId: number
	_deviceSection: PopupMenu.PopupMenuSection
	_sliderChangedId: number
	_options: StreamSlider.Options

	constructor(
		control: Gvc.MixerControl,
		stream: Gvc.MixerStream,
		options: VolumeMixerList.Options
	) {
		// @ts-ignore
		super(control, stream, options)
	}

	// @ts-ignore
	_init(control: Gvc.MixerControl, stream: Gvc.MixerStream|undefined, options: StreamSlider.Options) {
		this._options = options
		this._control = control
		this._notifyVolumeChangeId = 0
		this._maid = new Maid()
		super._init()
		this._maid.connectJob(this, "destroy", this._destroy.bind(this))
		
		// Update allow amplify
		this._soundSettings = new Gio.Settings({
			schema_id: 'org.gnome.desktop.sound',
		})
		this._maid.connectJob(
			this._soundSettings,
			`changed::${ALLOW_AMPLIFIED_VOLUME_KEY}`,
			this._updateAllowAmplified.bind(this)
		)
		this._updateAllowAmplified()

		// Update icon
		this.iconReactive = true
		this.connect("icon-clicked", ()=>{
			if (!this._stream) return
			this._stream.set_is_muted(!this._stream.is_muted)
		})

		// Value change connection
		this._inDrag = false
		this._sliderChangedId = this._maid.connectJob(this.slider, "notify::value", this._sliderChanged.bind(this))
		this._maid.connectJob(this.slider, "drag-begin", () => { this._inDrag = true })
		this._maid.connectJob(this.slider, "drag-end", () => { this._inDrag = false })

		// this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem())
		// this.menu.addSettingsAction(_('Sound Settings'), 'gnome-sound-panel.desktop')

		// Update stream
		if (stream) {
			this.stream = stream
		} else {
			this._stream = null
		}
	}

	// Stream connection
	_stream: Gvc.MixerStream
	get stream(): Gvc.MixerStream {
		return this._stream
	}
	set stream(stream: Gvc.MixerStream) {
		if (this._stream == stream) return

		this._stream?.disconnectObject(this)
		this._stream = stream

		if (stream) {
			// Create connection
			stream.connectObject(
				'notify::is-muted', this._updateSlider.bind(this),
				'notify::volume', this._updateSlider.bind(this),
				this
			)
			this._updateSlider()
		} else {
			this.emit('stream-updated')
		}

		this._sync()
	}
	_sync() {
		// Sync visibility
		this.visible = this._stream != null
		this.menuEnabled = false // this._deviceItems.size > 1

		// Show icon
		if (this._options.showIcon) {
			// this.icon_name = stream.get_icon_name()
			this.gicon = this._stream.get_gicon()
		}
	}

	// Volume feedback sfx
	_volumeCancellable?: Gio.Cancellable|null
	_feedbackVolumeChange() {
		// Cancel last sound
		if (this._volumeCancellable) this._volumeCancellable.cancel()
		this._volumeCancellable = null

		// Feedback not necessary while playing
		if (this._stream.state === Gvc.MixerStreamState.RUNNING) return

		// Play sound feedback
		this._volumeCancellable = new Gio.Cancellable()
		global
			.display
			.get_sound_player()
			.play_from_theme(
				'audio-volume-change',
				_('Volume changed'),
				this._volumeCancellable
			)
	}

	// Update slider value (without emitting notify::value connection)
	_updateSlider() {
		this.slider.block_signal_handler(this._sliderChangedId)
		this.slider.value =
			this._stream.is_muted
			? 0
			: (this._stream.volume / this._control.get_vol_max_norm())
		this.slider.unblock_signal_handler(this._sliderChangedId)
		this.emit('stream-updated')
	}

	// Slider value notify
	_sliderChanged() {
		if (!this._stream) return

		const volume: number = this.slider.value * this._control.get_vol_max_norm()
		const prevMuted: boolean = this._stream.is_muted
		const prevVolume: number = this._stream.volume
		const volumeChanged: boolean = this._stream.volume !== prevVolume
		if (volume < 1) {
			this._stream.volume = 0
			if (!prevMuted) this._stream.change_is_muted(true)
		} else {
			this._stream.volume = volume
			if (prevMuted) this._stream.change_is_muted(false)
		}
		this._stream.push_volume()

		if (volumeChanged && !this._notifyVolumeChangeId && !this._inDrag) {
			this._notifyVolumeChangeId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 30, () => {
				this._feedbackVolumeChange()
				this._notifyVolumeChangeId = 0
				return GLib.SOURCE_REMOVE
			})
			GLib.Source.set_name_by_id(
				this._notifyVolumeChangeId,
				'[quick-settings-tweaks] StreamSlider._sliderChanged: this._notifyVolumeChangeId'
			)
		}
	}

	// Update allow amplified from org.gnome.desktop.sound
	_soundSettings: Gio.Settings
	_allowAmplified: boolean
	_updateAllowAmplified() {
		this._allowAmplified = this._soundSettings.get_boolean(ALLOW_AMPLIFIED_VOLUME_KEY)
		this.slider.maximumValue = this._allowAmplified ? this.getMaxLevel() : 1
		if (this._stream) this._updateSlider()
	}

	getLevel(): number|null {
		if (!this._stream) return null
		return this._stream.volume / this._control.get_vol_max_norm()
	}
	getMaxLevel(): number {
		const maxVolume =
			this._allowAmplified
			? this._control.get_vol_max_amplified()
			: this._control.get_vol_max_norm()
		return maxVolume / this._control.get_vol_max_norm()
	}

	_destroy() {
		this._maid.destroy()
		this._maid = null
		if (this._notifyVolumeChangeId) {
			GLib.Source.remove(this._notifyVolumeChangeId)
			this._notifyVolumeChangeId = null
		}
		this._soundSettings = null
		if (this._volumeCancellable) {
			this._volumeCancellable.cancel()
			this._volumeCancellable = null
		}
	}

	// I have no idea why, slider has finite height, so we should floor it for scroll layout
	vfunc_get_preferred_height(for_width: number): [number, number] {
		return super.vfunc_get_preferred_height(for_width).map(Math.floor) as [number, number]
	}
}
GObject.registerClass({
	Signals: {
		'stream-updated': {},
	},
}, StreamSlider)
namespace StreamSlider {
	export interface Options {
		showIcon: boolean
	}
}
// #endregion StreamSlider

// #region VolumeMixerItem
class VolumeMixerItem extends St.BoxLayout {
	_control: Gvc.MixerControl
	_stream: Gvc.MixerStream
	_options: VolumeMixerItem.Options
	_slider: StreamSlider
	_label: St.Label
	constructor(
		control: Gvc.MixerControl,
		stream: Gvc.MixerStream|undefined,
		options: VolumeMixerItem.Options
	) {
		super(control, stream, options)
	}
	_init(
		control: Gvc.MixerControl,
		stream: Gvc.MixerStream|undefined,
		options: VolumeMixerItem.Options
	) {
		super._init({
			vertical: true,
			style_class: "QSTWEAKS-item",
		})
		this._control = control
		this._stream = stream
		this._options = options

		// Create label
		const label = this._label = new St.Label({
			x_expand: true,
			style_class: "QSTWEAKS-label",
			opacity: this._options.labelOpacity,
		})
		this._updateLabel()
		this.add_child(label)

		// Create Slider
		const slider = this._slider = new StreamSlider(control, stream, options)
		this.add_child(slider)
	}

	_updateLabel() {
		const label = this._label
		const name = this._stream.get_name()
		const description = this._stream.get_description()
		switch (this._options.labelText) {
			case "title":
				if (name) label.text = name
				else if (description) label.text = description
				if (description || name) label.show()
				else label.hide()
				break
			case "description":
				if (description) label.text = description
				else if (name) label.text = name
				if (description || name) label.show()
				else label.hide()
				break
			case "both":
				if (name && description) label.text = `${name} - ${description}`
				else if (name) label.text = name
				else if (description) label.text = description
				if (name || description) label.show()
				else label.hide()
				break
			case "none":
				label.hide()
				break
		}
	}

	_sync() {
		this._updateLabel()
		this._slider._sync()
	}
}
GObject.registerClass(VolumeMixerItem)
namespace VolumeMixerItem {
	export type Options = {
		labelText: "title"|"description"|"both"|"none",
		labelOpacity: number,
	} & StreamSlider.Options
}
// #endregion VolumeMixerItem

// #region VolumeMixerList
class VolumeMixerList extends St.BoxLayout {
	_control: Gvc.MixerControl
	_maid: Maid
	_options: VolumeMixerList.Options
	_sliders: Map<number, VolumeMixerItem>
	shouldShow: boolean

	constructor(options: VolumeMixerList.Options) {
		super({
			style_class: "QSTWEAKS-volume-mixer",
			clip_to_allocation: true,
			vertical: true,
			x_expand: true,
		})
		this._options = options
		this._maid = new Maid()
		this._sliders = new Map()

		// this._applicationMenus = new Map()//{}

		this._control = Volume.getMixerControl()
		this._maid.connectJob(this._control, "stream-added", this._streamAdded.bind(this))
		this._maid.connectJob(this._control, "stream-removed", this._streamRemoved.bind(this))
		this._maid.connectJob(this._control, "stream-changed", this._streamChanged.bind(this))
		for (const stream of this._control.get_streams()) {
			this._streamAdded(this._control, stream.get_id())
		}

		this.connect("destroy", ()=>{
			this._maid.destroy()
			this._maid = null
			for (const slider of this._sliders.values()) {
				slider.destroy()
			}
			this._sliders = null
		})

		// Group with application id << we need this
		// description regex
		// name regex
		// application regex
		// show as popup menu

		// this._filteredApps = settings["volume-mixer-filtered-apps"]
		// this._filterMode = settings["volume-mixer-filter-mode"]
		// this._showStreamDesc = settings["volume-mixer-show-description"]
		// this._showStreamIcon = settings["volume-mixer-show-icon"]
		// this._useRegex = settings["volume-mixer-use-regex"]
		// this._checkDescription = settings["volume-mixer-check-description"]
	}

	_streamAdded(control: Gvc.MixerControl, id: number) {
		if (this._sliders.has(id)) {
			return
		}
		const stream = control.lookup_stream_id(id)

		if (stream.is_event_stream || !(stream instanceof Gvc.MixerSinkInput)) {
			return
		}
		
		// const applicationId =  stream.get_application_id()
		// const name = stream.get_name()
		// const description = stream.get_description()

		// filter here
		// let hasFiltered = false
		// for (const matchStr of this._filteredApps) {
		// 	let matchExp = this._useRegex ? new RegExp(matchStr) : matchStr
		// 	if (
		// 		// Check name
		// 		this._checkMatch(name, matchExp)
		// 		// Check description
		// 		|| this._checkDescription && this._checkMatch(description, matchExp)
		// 	) { hasFiltered = true; break }
		// }
		// if (this._filterMode === "block" && hasFiltered) return
		// if (this._filterMode === "allow" && !hasFiltered) return

		const slider = new VolumeMixerItem(
			this._control,
			stream,
			this._options
		)
		this._sliders.set(id, slider)

		this.add_child(slider)
		this._sync()
	}

	_streamChanged(control: Gvc.MixerControl, id: number) {
		const slider = this._sliders.get(id)
		const stream = control.lookup_stream_id(id)
		if (!slider) return
		// filter check here, or create new here
		slider._sync()
	}

	_streamRemoved(_control: Gvc.MixerControl, id: number) {
		const slider = this._sliders.get(id)
		if (!slider) return
		slider.destroy()
		this._sliders.delete(id)
		this._sync()
	}

	_sync() {
		if (!this._sliders.size) {
			this.shouldShow = false
			return
		}
		for (const slider of this._sliders.values()) {
			if (slider.visible) {
				this.shouldShow = true
				return
			}
		}
		this.shouldShow = false
	}
}
GObject.registerClass({
	Properties: {
		'should-show': GObject.ParamSpec.boolean(
			'should-show', null, null,
			GObject.ParamFlags.READWRITE,
			false),
	},
}, VolumeMixerList)
namespace VolumeMixerList {
	export type Options = {
	} & VolumeMixerItem.Options
}
// #endregion VolumeMixerList

// #region VolumeMixerWidget
class VolumeMixerWidget extends St.BoxLayout {
	_options: VolumeMixerWidget.Options
	// _header: Header
	_list: VolumeMixerList
	_scroll: St.ScrollView
	_sections: St.BoxLayout
	constructor(options: VolumeMixerWidget.Options) {
		super(options)
	}
	_init(options: VolumeMixerWidget.Options) {
		super._init({
			vertical: true,
		} as Partial<St.BoxLayout.ConstructorProps>)

		this._options = options

		this._createScroll()
		this.add_child(this._scroll)
		this._updateMaxHeight()
		this._updateStyleClass()
		this._list.connect("notify::should-show", this._sync.bind(this))
		this._sync()
	}

	// Box style
	_updateMaxHeight() {
		const maxHeight = this._options.maxHeight
		this.style = maxHeight
			? `max-height:${maxHeight}px;`
			: ""
	}
	_updateStyleClass() {
		const options = this._options
		let style = "QSTWEAKS-volume-mixer"
		this.style_class = style
	}

	// Scroll view
	_createScroll() {
		this._sections = new St.BoxLayout({
			vertical: true,
			x_expand: true,
			y_expand: true,
		})
		this._scroll = new St.ScrollView({
			x_expand: true,
			y_expand: true,
			child: this._sections,
		})
		this._updateScrollStyle()
		this._scroll.connect(
			"notify::vscrollbar-visible",
			this._syncScrollbarPadding.bind(this)
		)
		this._syncScrollbarPadding()
		this._list = new VolumeMixerList(this._options)
		this._sections.add_child(this._list)
	}
	_updateScrollStyle() {
		StyledScroll.updateStyle(this._scroll, this._options.scrollStyle)
	}
	_syncScrollbarPadding() {
		this._sections.style_class =
			this._scroll.vscrollbar_visible
			? "QSTWEAKS-has-scrollbar"
			: ""
	}

	// Get height with avoiding unnecessary allocation
	vfunc_get_preferred_height(for_width: number): [number, number] {
		if (!this.get_stage()) return [0, 0]
		const contentHeight = this._list.get_preferred_height(for_width)
		const maxHeight = this._options.maxHeight
		if (!maxHeight) return contentHeight
		return [Math.min(maxHeight, contentHeight[0]), Math.min(maxHeight, contentHeight[1])]
	}

	_sync() {
		this.visible = this._list.shouldShow
	}
}
GObject.registerClass(VolumeMixerWidget)
namespace VolumeMixerWidget {
	export type Options = {
		maxHeight: number,
		scrollStyle: StyledScroll.Options
	}
		& Partial<St.BoxLayout.ConstructorProps>
		& VolumeMixerList.Options
}
// #endregion VolumeMixerWidget

// #region VolumeMixerWidgetFeature
export class VolumeMixerWidgetFeature extends FeatureBase {
	// #region settings
	enabled: boolean
	showIcon: boolean
	maxHeight: number
	labelText: VolumeMixerItem.Options["labelText"]
	labelOpacity: number
	menuEnabled: boolean
	menuIcon: string
	scrollStyle: StyledScroll.Options
	override loadSettings(loader: SettingLoader): void {
		this.enabled = loader.loadBoolean("volume-mixer-enabled")
		this.showIcon = loader.loadBoolean("volume-mixer-show-icon")
		this.maxHeight = loader.loadInt("volume-mixer-max-height")
		this.labelText = loader.loadString("volume-mixer-label-text") as VolumeMixerItem.Options["labelText"]
		this.labelOpacity = loader.loadInt("volume-mixer-label-opacity")
		this.menuEnabled = loader.loadBoolean("volume-mixer-menu-enabled")
		this.menuIcon = loader.loadString("volume-mixer-menu-icon")
		this.scrollStyle = StyledScroll.Options.fromLoader(loader, "volume-mixer")
	}
	// #endregion settings

	volumeMixerWidget: VolumeMixerWidget
	mixerMenuButton: St.Button
	mixerMenuSection: PopupMenu.PopupMenuSection
	createMenu(slider: QuickSlider) {
		// Create section
		this.mixerMenuSection = new PopupMenu.PopupMenuSection()
		this.mixerMenuSection.box.add_child(this.volumeMixerWidget)
		this.mixerMenuSection.box.hide()
		this.maid.destroyJob(this.mixerMenuSection)

		// Create button
		this.mixerMenuButton = new St.Button({
			child: new St.Icon({icon_name: this.menuIcon}),
			style_class: 'icon-button flat',
			can_focus: true,
			x_expand: false,
			y_expand: true,
			visible: this.volumeMixerWidget.visible,
			accessible_name: _('Open volumx mixer'),
		})
		this.volumeMixerWidget.bind_property(
			"visible",
			this.mixerMenuButton,
			"visible",
			null
		)
		this.maid.destroyJob(this.mixerMenuButton)

		// Push to output stream slider menu
		slider.menu.addMenuItem(this.mixerMenuSection, 1)
		slider.child.add_child(this.mixerMenuButton)
		const revertChanges = ()=>{
			slider.menu.setHeader('audio-headphones-symbolic', (_)('Sound Output'));
			(slider.menu as any)._setSettingsVisibility(Main.sessionMode.allowSettings);
			updateMenuSeparators(slider.menu);
			(slider as any)._deviceSection.box.show()
		}
		this.mixerMenuButton.connect('clicked', () => {
			this.mixerMenuSection.box.show();
			(slider as any)._deviceSection.box.hide();
			(slider.menu as any)._setSettingsVisibility(false);
			updateMenuSeparators(slider.menu)
			slider.menu.setHeader('audio-headphones-symbolic', _('Volume Mixer'))
			slider.menu.open(true)
		})
		this.maid.connectJob(slider.menu, "menu-closed", ()=>{
			this.mixerMenuSection.box.hide()
			revertChanges()
		})
		this.maid.functionJob(revertChanges)
	}
	override reload(key: string): void {
		switch (key) {
			case "volume-mixer-max-height":
				if (!this.enabled) return
				this.volumeMixerWidget!._updateMaxHeight()
				break
			case "volume-mixer-fade-offset":
			case "volume-mixer-show-scrollbar":
				if (!this.enabled) return
				this.volumeMixerWidget!._updateScrollStyle()
				break
			default:
				super.reload()
				break
		}
	}
	override onLoad(): void {
		this.maid.destroyJob(
			this.volumeMixerWidget = new VolumeMixerWidget(this)
		)
		if (this.menuEnabled) {
			Global.GetStreamSlider().then(
				({ OutputStreamSlider }) => this.createMenu(OutputStreamSlider)
			).catch(Logger.error)
		} else {
			(Global.QuickSettingsMenu as any).addItem(this.volumeMixerWidget, 2)
			Global.GetStreamSlider().then(({ InputStreamSlider }) => {
				Global.QuickSettingsGrid.set_child_above_sibling(
					this.volumeMixerWidget,
					InputStreamSlider
				)
			})
		}
	}
	override onUnload(): void {
		this.volumeMixerWidget = null
	}
}
// #endregion VolumeMixerWidgetFeature
