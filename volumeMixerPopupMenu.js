const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { Settings, SettingsSchemaSource } = imports.gi.Gio
const { MixerSinkInput } = imports.gi.Gvc
const { GObject, Gtk, Gvc, St, Clutter } = imports.gi
const { SystemIndicator } = imports.ui.quickSettings
const Main = imports.ui.main
const { PopupLayoutManager } = Me.imports.layout

// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/popupMenu.js
const PopupMenu = imports.ui.popupMenu
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/status/volume.js
const Volume = imports.ui.status.volume

var VolumeMixerPopupMenu = GObject.registerClass(
  {},
  class VolumeMixerPopupMenu extends SystemIndicator {
    // constructor() {
    //   super()

    _init() {
      super._init()

      const lm = new PopupLayoutManager()

      this._container = new St.Widget({
        layout_manager: lm,
      })

      Main.panel.statusArea.quickSettings.menu.addItem(this._container, 2)

      this._applicationStreams = {}

      this._control = Volume.getMixerControl()
      this._streamAddedEventId = this._control.connect(
        'stream-added',
        this._streamAdded.bind(this)
      )
      this._streamRemovedEventId = this._control.connect(
        'stream-removed',
        this._streamRemoved.bind(this)
      )

      let gschema = SettingsSchemaSource.new_from_directory(
        Me.dir.get_child('schemas').get_path(),
        SettingsSchemaSource.get_default(),
        false
      )

      this.settings = new Settings({
        settings_schema: gschema.lookup(
          'net.evermiss.mymindstorm.volume-mixer',
          true
        ),
      })

      this._settingsChangedId = this.settings.connect('changed', () =>
        this._updateStreams()
      )

      this._updateStreams()
    }

    _streamAdded(control, id) {
      if (id in this._applicationStreams) {
        return
      }

      const stream = control.lookup_stream_id(id)

      if (stream.is_event_stream || !(stream instanceof MixerSinkInput)) {
        return
      }

      if (this._filterMode === 'block') {
        if (this._filteredApps.indexOf(stream.get_name()) !== -1) {
          return
        }
      } else if (this._filterMode === 'allow') {
        if (this._filteredApps.indexOf(stream.get_name()) === -1) {
          return
        }
      }

      const { ApplicationStreamSlider } = Me.imports.applicationStreamSlider

      const slider = new ApplicationStreamSlider(Volume.getMixerControl())

      if (this._showStreamIcon) {
        slider._icon.icon_name = stream.get_icon_name()
      }

      const name = stream.get_name(),
        description = stream.get_description()

      if (name || description) {
        slider._label.text =
          name && this._showStreamDesc
            ? `${name} - ${description}`
            : name || description
      }

      slider.stream = stream

      /**
       stream, {
        showDesc: this._showStreamDesc,
        showIcon: this._showStreamIcon,
      }
       */

      this._applicationStreams[id] = slider

      this._container.add_child(slider)

      // this._container.add_child(sans)

      // for (const item of sans.quickSettingsItems) {
      //   this._container.add_child(item)
      // }

      // log('Control Add ' + id)

      // Main.panel.statusArea.quickSettings.menu.addItem(slider, 2)

      // this.addMenuItem(this._applicationStreams[id].item)
      // this.add(this.item.actor)
      // log(id)
      // imports.ui.main.__test = id
      // this.addMenuItem(slider)
      // let test =
      // volumeMixer.actor.add(this._applicationStreams[id].item.actor)
      // this.box.add_child(this._applicationStreams[id].item.actor)
      // this.actor.add_child(this._applicationStreams[id].item.actor)
    }

    _streamRemoved(_control, id) {
      if (id in this._applicationStreams) {
        this._container.remove_child(this._applicationStreams[id])
        delete this._applicationStreams[id]
      }
    }

    _updateStreams() {
      for (const id in this._applicationStreams) {
        this._applicationStreams[id].item.destroy()
        delete this._applicationStreams[id]
      }

      this._filteredApps = this.settings.get_strv('filtered-apps')
      this._filterMode = this.settings.get_string('filter-mode')
      this._showStreamDesc = this.settings.get_boolean('show-description')
      this._showStreamIcon = this.settings.get_boolean('show-icon')

      for (const stream of this._control.get_streams()) {
        this._streamAdded(this._control, stream.get_id())
      }
    }

    destroy() {
      this._control.disconnect(this._streamAddedEventId)
      this._control.disconnect(this._streamRemovedEventId)
      this.settings.disconnect(this._settingsChangedId)
      super.destroy()
    }
  }
)
