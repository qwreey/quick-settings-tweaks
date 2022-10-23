const { BoxLayout, Label } = imports.gi.St
const { GObject, Gio, GLib, Gvc } = imports.gi

// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/status/volume.js
const Volume = imports.ui.status.volume

const ALLOW_AMPLIFIED_VOLUME_KEY = 'allow-volume-above-100-percent';
const { QuickSlider } = imports.ui.quickSettings;
const PopupMenu = imports.ui.popupMenu;
var StreamSlider = GObject.registerClass({
  Signals: {
      'stream-updated': {},
  },
}, class StreamSlider extends QuickSlider {
  _init(control) {
      super._init();

      this._control = control;

      this._inDrag = false;
      this._notifyVolumeChangeId = 0;

      this._soundSettings = new Gio.Settings({
          schema_id: 'org.gnome.desktop.sound',
      });
      this._soundSettings.connect(`changed::${ALLOW_AMPLIFIED_VOLUME_KEY}`,
          () => this._amplifySettingsChanged());
      this._amplifySettingsChanged();

      this._sliderChangedId = this.slider.connect('notify::value',
          () => this._sliderChanged());
      this.slider.connect('drag-begin', () => (this._inDrag = true));
      this.slider.connect('drag-end', () => {
          this._inDrag = false;
          this._notifyVolumeChange();
      });

      this._deviceItems = new Map();

      this._deviceSection = new PopupMenu.PopupMenuSection();
      this.menu.addMenuItem(this._deviceSection);

      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
      this.menu.addSettingsAction(_('Sound Settings'),
          'gnome-sound-panel.desktop');

      this._stream = null;
      this._volumeCancellable = null;
      this._icons = [];

      this._sync();
  }

  get stream() {
      return this._stream;
  }

  set stream(stream) {
      this._stream?.disconnectObject(this);

      this._stream = stream;

      if (this._stream) {
          this._connectStream(this._stream);
          this._updateVolume();
      } else {
          this.emit('stream-updated');
      }

      this._sync();
  }

  _connectStream(stream) {
      stream.connectObject(
          'notify::is-muted', this._updateVolume.bind(this),
          'notify::volume', this._updateVolume.bind(this), this);
  }

  _lookupDevice(_id) {
      throw new GObject.NotImplementedError(
          `_lookupDevice in ${this.constructor.name}`);
  }

  _activateDevice(_device) {
      throw new GObject.NotImplementedError(
          `_activateDevice in ${this.constructor.name}`);
  }

  _addDevice(id) {
      if (this._deviceItems.has(id))
          return;

      const device = this._lookupDevice(id);
      if (!device)
          return;

      const {description, origin} = device;
      const name = origin
          ? `${description} – ${origin}`
          : description;
      const item = new PopupMenu.PopupImageMenuItem(name, device.get_gicon());
      item.connect('activate', () => this._activateDevice(device));

      this._deviceSection.addMenuItem(item);
      this._deviceItems.set(id, item);

      this._sync();
  }

  _removeDevice(id) {
      this._deviceItems.get(id)?.destroy();
      if (this._deviceItems.delete(id))
          this._sync();
  }

  _setActiveDevice(activeId) {
      for (const [id, item] of this._deviceItems) {
          item.setOrnament(id === activeId
              ? PopupMenu.Ornament.CHECK
              : PopupMenu.Ornament.NONE);
      }
  }

  _shouldBeVisible() {
      return this._stream != null;
  }

  _sync() {
      this.visible = this._shouldBeVisible();
      this.menuEnabled = this._deviceItems.size > 1;
  }

  _sliderChanged() {
      if (!this._stream)
          return;

      let value = this.slider.value;
      let volume = value * this._control.get_vol_max_norm();
      let prevMuted = this._stream.is_muted;
      let prevVolume = this._stream.volume;
      if (volume < 1) {
          this._stream.volume = 0;
          if (!prevMuted)
              this._stream.change_is_muted(true);
      } else {
          this._stream.volume = volume;
          if (prevMuted)
              this._stream.change_is_muted(false);
      }
      this._stream.push_volume();

      let volumeChanged = this._stream.volume !== prevVolume;
      if (volumeChanged && !this._notifyVolumeChangeId && !this._inDrag) {
          this._notifyVolumeChangeId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 30, () => {
              this._notifyVolumeChange();
              this._notifyVolumeChangeId = 0;
              return GLib.SOURCE_REMOVE;
          });
          GLib.Source.set_name_by_id(this._notifyVolumeChangeId,
              '[gnome-shell] this._notifyVolumeChangeId');
      }
  }

  _notifyVolumeChange() {
      if (this._volumeCancellable)
          this._volumeCancellable.cancel();
      this._volumeCancellable = null;

      if (this._stream.state === Gvc.MixerStreamState.RUNNING)
          return; // feedback not necessary while playing

      this._volumeCancellable = new Gio.Cancellable();
      let player = global.display.get_sound_player();
      player.play_from_theme('audio-volume-change',
          _('Volume changed'), this._volumeCancellable);
  }

  _changeSlider(value) {
      this.slider.block_signal_handler(this._sliderChangedId);
      this.slider.value = value;
      this.slider.unblock_signal_handler(this._sliderChangedId);
  }

  _updateVolume() {
      let muted = this._stream.is_muted;
      this._changeSlider(muted
          ? 0 : this._stream.volume / this._control.get_vol_max_norm());
      this.emit('stream-updated');
  }

  _amplifySettingsChanged() {
      this._allowAmplified = this._soundSettings.get_boolean(ALLOW_AMPLIFIED_VOLUME_KEY);

      this.slider.maximum_value = this._allowAmplified
          ? this.getMaxLevel() : 1;

      if (this._stream)
          this._updateVolume();
  }

  getIcon() {
      if (!this._stream)
          return null;

      let volume = this._stream.volume;
      let n;
      if (this._stream.is_muted || volume <= 0) {
          n = 0;
      } else {
          n = Math.ceil(3 * volume / this._control.get_vol_max_norm());
          n = Math.clamp(n, 1, this._icons.length - 1);
      }
      return this._icons[n];
  }

  getLevel() {
      if (!this._stream)
          return null;

      return this._stream.volume / this._control.get_vol_max_norm();
  }

  getMaxLevel() {
      let maxVolume = this._control.get_vol_max_norm();
      if (this._allowAmplified)
          maxVolume = this._control.get_vol_max_amplified();

      return maxVolume / this._control.get_vol_max_norm();
  }
});

var ApplicationStreamSlider = GObject.registerClass({},class ApplicationStreamSlider extends StreamSlider {
  constructor(stream, opts) {
    // try {
    super(Volume.getMixerControl())
    // } catch (err) {
      // if(!imports.ui.main._log){imports.ui.main._log=[]} imports.ui.main._log.push(err.toString())
    // }
    
    // this.stream = stream
    
    if (opts.showIcon) {
      this._icon.icon_name = stream.get_icon_name()
    }
    
    // try {
    //   let name = stream.get_name()
    //   let description = stream.get_description()
      
    //   if (name || description) {
    //     this._vbox = new BoxLayout()
    //     this._vbox.vertical = true

    //     this._label = new Label()
    //     this._label.text = name && opts.showDesc ? `${name} - ${description}` : (name || description)
    //     this._vbox.add(this._label)

    //     if(!imports.ui.main._log){imports.ui.main._log=[]} imports.ui.main._log.push(this)
    //     let slider = this.actor.first_child
    //     this.actor.remove_child(this.actor.first_child)
    //     this._vbox.add(slider)
    //     this.slider.set_height(32)
        
    //     this.actor.add_child(this._vbox)
    //   }
    // } catch (err) {
    //   if(!imports.ui.main._log){imports.ui.main._log=[]} imports.ui.main._log.push(err)
    // }
  }
})