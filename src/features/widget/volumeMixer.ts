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
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js"
import * as Volume from "resource:///org/gnome/shell/ui/status/volume.js"
import { FeatureBase, type SettingLoader } from "../../libs/feature.js"
import Maid from "../../libs/maid.js"
import { Global } from "../../global.js"
// import { Global } from "../../global.js"
// import { fixStScrollViewScrollbarOverflow } from "../../libs/utility.js"

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
		options: VolumeMixerWidget.Options
	) {
		// @ts-expect-error
		super(control, stream, options)
	}

	// @ts-expect-error
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

		// @ts-expect-error
		this._stream?.disconnectObject(this)
		this._stream = stream

		if (stream) {
			// Create connection
			// @ts-expect-error
			stream.connectObject(
				'notify::is-muted', this._updateSlider.bind(this),
				'notify::volume', this._updateSlider.bind(this),
				this
			)
			this._updateSlider()
		} else {
			this.emit('stream-updated')
		}

		// Show icon
		if (this._options.showIcon) {
			this.icon_name = stream.get_icon_name()
		}

		this._sync()
	}

	// Sync visibility
	_sync() {
		this.visible = this._stream != null
		this.menuEnabled = false // this._deviceItems.size > 1
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
			style_class: "QSTWEAKS-volume-mixer"
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
		this.updateLabel()
		this.add_child(label)

		// Create Slider
		const slider = this._slider = new StreamSlider(control, stream, options)
		this.add_child(slider)
	}

	updateLabel() {
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
}
GObject.registerClass(VolumeMixerItem)
namespace VolumeMixerItem {
	export type Options = {
		labelText: "title"|"description"|"both"|"none",
		labelOpacity: number,
	} & StreamSlider.Options
}
// #endregion VolumeMixerItem

// #region VolumeMixerWidget
class VolumeMixerWidget extends PopupMenu.PopupMenuSection {
	_control: Gvc.MixerControl
	_maid: Maid
	_options: VolumeMixerWidget.Options
	_sliders: Map<number, VolumeMixerItem>

	constructor(options: VolumeMixerWidget.Options) {
		super()
		this.actor.hide()
		this._options = options
		this._maid = new Maid()
		this._sliders = new Map()

		// this._applicationMenus = new Map()//{}

		this._control = Volume.getMixerControl()
		this._maid.connectJob(this._control, "stream-added", this._streamAdded.bind(this))
		this._maid.connectJob(this._control, "stream-removed", this._streamRemoved.bind(this))
		for (const stream of this._control.get_streams()) {
			this._streamAdded(this._control, stream.get_id())
		}

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

	_streamAdded(control:Gvc.MixerControl, id: number) {
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

		this.actor.add_child(slider)
		slider.visible = true
		this.actor.show()
	}

	_streamRemoved(_control: Gvc.MixerControl, id: number) {
		const slider = this._sliders.get(id)
		if (!slider) return
		slider.destroy()
		this._sliders.delete(id)
		if (!this._sliders.size) this.actor.hide()
	}

	destroy() {
		this._maid.destroy()
		this._maid = null
		for (const slider of this._sliders.values()) {
			slider.destroy()
		}
		this._sliders = null
		super.destroy()
	}
}
namespace VolumeMixerWidget {
	export type Options = {
	} & VolumeMixerItem.Options
}
// #endregion VolumeMixerWidget

// #region VolumeMixerWidgetFeature
export class VolumeMixerWidgetFeature extends FeatureBase {
	// #region settings
	enabled: boolean
	scroll: boolean
	showIcon: boolean
	maxHeight: number
	labelText: VolumeMixerItem.Options["labelText"]
	labelOpacity: number
	override loadSettings(loader: SettingLoader): void {
		this.enabled = loader.loadBoolean("volume-mixer-enabled")
		this.scroll = loader.loadBoolean("volume-mixer-show-scrollbar")
		this.showIcon = loader.loadBoolean("volume-mixer-show-icon")
		this.maxHeight = loader.loadInt("volume-mixer-max-height")
		this.labelText = loader.loadString("volume-mixer-label-text") as VolumeMixerItem.Options["labelText"]
		this.labelOpacity = loader.loadInt("volume-mixer-label-opacity")
	}
	// #endregion settings

	volumeMixerWidget: VolumeMixerWidget
	onLoad(): void {
		this.maid.destroyJob(
			this.volumeMixerWidget = new VolumeMixerWidget(this)
		)
		Global.QuickSettingsMenu.addItem(this.volumeMixerWidget.actor, 2) //.actor, 2)
		// if (Global.Settings.get_string("volume-mixer-position") === "top") {
		Global.GetStreamSlider(({ InputStreamSlider }) => {
			Global.QuickSettingsMenu._grid.set_child_above_sibling(
				this.volumeMixerWidget.actor,
				InputStreamSlider
			)
		})
		// }
	}
	onUnload(): void {
		this.volumeMixerWidget = null
	}
}
// #endregion VolumeMixerWidgetFeature
