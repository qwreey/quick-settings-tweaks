const { Clutter, Gio, GLib, GObject, Gvc, St } = imports.gi
const { Slider } = imports.ui.slider

const Main = imports.ui.main
const PopupMenu = imports.ui.popupMenu

const Volume = imports.ui.status.volume

const { SystemIndicator, QuickSettingsItem } = imports.ui.quickSettings

const ALLOW_AMPLIFIED_VOLUME_KEY = 'allow-volume-above-100-percent'

const QuickSlider = GObject.registerClass(
  {
    Properties: {
      'icon-name': GObject.ParamSpec.override('icon-name', St.Button),
      gicon: GObject.ParamSpec.object(
        'gicon',
        '',
        '',
        GObject.ParamFlags.READWRITE,
        Gio.Icon
      ),
      'menu-enabled': GObject.ParamSpec.boolean(
        'menu-enabled',
        '',
        '',
        GObject.ParamFlags.READWRITE,
        false
      ),
    },
  },
  class AppVolumeMixerQuickSlider extends QuickSettingsItem {
    _init(params) {
      super._init({
        style_class: 'quick-slider',
        ...params,
        can_focus: false,
        reactive: false,
        hasMenu: true,
      })

      const box = new St.BoxLayout({
        vertical: true,
      })
      const box2 = new St.BoxLayout({})
      this.set_child(box)

      box.add_child(box2)

      const iconProps = {}
      if (this.gicon) iconProps['gicon'] = this.gicon
      if (this.iconName) iconProps['icon-name'] = this.iconName

      this._icon = new St.Icon({
        style_class: 'quick-toggle-icon',
        ...iconProps,
      })

      this._icon.style = 'icon-size: 1.4em;'

      this._label = new St.Label({
        text: 'Hi',
      })

      this._label.style = 'padding-left: 6px;font-size: 0.92em;'

      box2.add_child(this._icon)
      box2.add_child(this._label)

      // bindings are in the "wrong" direction, so we
      // pick up StIcon's linking of the two properties
      this._icon.bind_property(
        'icon-name',
        this,
        'icon-name',
        GObject.BindingFlags.SYNC_CREATE | GObject.BindingFlags.BIDIRECTIONAL
      )
      this._icon.bind_property(
        'gicon',
        this,
        'gicon',
        GObject.BindingFlags.SYNC_CREATE | GObject.BindingFlags.BIDIRECTIONAL
      )

      this.slider = new Slider(0)

      // for focus indication
      const sliderBin = new St.Bin({
        style_class: 'slider-bin',
        child: this.slider,
        reactive: true,
        can_focus: true,
        x_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
      })
      box.add_child(sliderBin)

      sliderBin.set_accessible(this.slider.get_accessible())
      sliderBin.connect('event', (bin, event) =>
        this.slider.event(event, false)
      )

      this._menuButton = new St.Button({
        child: new St.Icon({ icon_name: 'go-next-symbolic' }),
        style_class: 'icon-button flat',
        can_focus: true,
        x_expand: false,
        y_expand: true,
      })
      box.add_child(this._menuButton)

      this.bind_property(
        'menu-enabled',
        this._menuButton,
        'visible',
        GObject.BindingFlags.SYNC_CREATE
      )
      this._menuButton.connect('clicked', () => this.menu.open())
      this.slider.connect('popup-menu', () => {
        if (this.menuEnabled) this.menu.open()
      })
    }
  }
)

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
