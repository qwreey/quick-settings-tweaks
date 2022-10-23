const { Clutter, Gio, GLib, GObject, Gvc } = imports.gi

const Main = imports.ui.main
const PopupMenu = imports.ui.popupMenu

const Volume = imports.ui.status.volume

const { QuickSlider, SystemIndicator } = imports.ui.quickSettings

const ALLOW_AMPLIFIED_VOLUME_KEY = 'allow-volume-above-100-percent'

var ApplicationStreamSlider = GObject.registerClass(
  {
    Signals: {
      'stream-updated': {},
    },
  },
  class ApplicationStreamSlider extends QuickSlider {
    _init(control) {
      super._init()

      this._control = control

      this._soundSettings = new Gio.Settings({
        schema_id: 'org.gnome.desktop.sound',
      })
      this._soundSettings.connect(
        `changed::${ALLOW_AMPLIFIED_VOLUME_KEY}`,
        () => this._amplifySettingsChanged()
      )
      this._amplifySettingsChanged()

      this._sliderChangedId = this.slider.connect('notify::value', () =>
        this._sliderChanged()
      )
      this.slider.connect('drag-begin', () => (this._inDrag = true))
      this.slider.connect('drag-end', () => {
        this._inDrag = false
        this._notifyVolumeChange()
      })
    }

    get stream() {
      return this._stream
    }

    set stream(stream) {
      this._stream?.disconnectObject(this)

      this._stream = stream

      if (this._stream) {
        this._connectStream(this._stream)
        this._updateVolume()
      } else {
        this.emit('stream-updated')
      }
    }

    _connectStream(stream) {
      stream.connectObject(
        'notify::is-muted',
        this._updateVolume.bind(this),
        'notify::volume',
        this._updateVolume.bind(this),
        this
      )
    }

    _sliderChanged() {
      if (!this._stream) return

      let value = this.slider.value
      let volume = value * this._control.get_vol_max_norm()
      let prevMuted = this._stream.is_muted
      let prevVolume = this._stream.volume
      if (volume < 1) {
        this._stream.volume = 0
        if (!prevMuted) this._stream.change_is_muted(true)
      } else {
        this._stream.volume = volume
        if (prevMuted) this._stream.change_is_muted(false)
      }
      this._stream.push_volume()

      let volumeChanged = this._stream.volume !== prevVolume
      if (volumeChanged && !this._notifyVolumeChangeId && !this._inDrag) {
        this._notifyVolumeChangeId = GLib.timeout_add(
          GLib.PRIORITY_DEFAULT,
          30,
          () => {
            this._notifyVolumeChange()
            this._notifyVolumeChangeId = 0
            return GLib.SOURCE_REMOVE
          }
        )
        GLib.Source.set_name_by_id(
          this._notifyVolumeChangeId,
          '[gnome-shell] this._notifyVolumeChangeId'
        )
      }
    }

    _notifyVolumeChange() {
      if (this._volumeCancellable) this._volumeCancellable.cancel()
      this._volumeCancellable = null

      if (this._stream.state === Gvc.MixerStreamState.RUNNING) return // feedback not necessary while playing

      this._volumeCancellable = new Gio.Cancellable()
      let player = global.display.get_sound_player()
      player.play_from_theme(
        'audio-volume-change',
        _('Volume changed'),
        this._volumeCancellable
      )
    }

    _changeSlider(value) {
      this.slider.block_signal_handler(this._sliderChangedId)
      this.slider.value = value
      this.slider.unblock_signal_handler(this._sliderChangedId)
    }

    _updateVolume() {
      let muted = this._stream.is_muted
      this._changeSlider(
        muted ? 0 : this._stream.volume / this._control.get_vol_max_norm()
      )
      this.emit('stream-updated')
    }

    _amplifySettingsChanged() {
      this._allowAmplified = this._soundSettings.get_boolean(
        ALLOW_AMPLIFIED_VOLUME_KEY
      )

      this.slider.maximum_value = this._allowAmplified ? this.getMaxLevel() : 1

      if (this._stream) this._updateVolume()
    }

    getLevel() {
      if (!this._stream) return null

      return this._stream.volume / this._control.get_vol_max_norm()
    }

    getMaxLevel() {
      let maxVolume = this._control.get_vol_max_norm()
      if (this._allowAmplified)
        maxVolume = this._control.get_vol_max_amplified()

      return maxVolume / this._control.get_vol_max_norm()
    }
  }
)
