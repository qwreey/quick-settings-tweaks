const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const { ApplicationStreamSlider } = Me.imports.applicationStreamSlider

const { Settings, SettingsSchemaSource } = imports.gi.Gio
const { MixerSinkInput } = imports.gi.Gvc

// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/popupMenu.js
const PopupMenu = imports.ui.popupMenu
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/status/volume.js
const Volume = imports.ui.status.volume

var VolumeMixerPopupMenu = class VolumeMixerPopupMenu extends PopupMenu.PopupMenuSection {
    constructor() {
        super()
        this._applicationStreams = {}

        // The PopupSeparatorMenuItem needs something above and below it or it won't display
        this._hiddenItem = new PopupMenu.PopupBaseMenuItem()
        this._hiddenItem.set_height(0)
        this.addMenuItem(this._hiddenItem)

        this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem())
        
        this._control = Volume.getMixerControl()
        this._streamAddedEventId = this._control.connect("stream-added", this._streamAdded.bind(this))
        this._streamRemovedEventId = this._control.connect("stream-removed", this._streamRemoved.bind(this))

        let gschema = SettingsSchemaSource.new_from_directory(
            Me.dir.get_child('schemas').get_path(),
            SettingsSchemaSource.get_default(),
            false
        )

        this.settings = new Settings({
            settings_schema: gschema.lookup('net.evermiss.mymindstorm.volume-mixer', true)
        })

        this._settingsChangedId = this.settings.connect('changed', () => this._updateStreams())

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
        
        if (this._filterMode === "block") {
            if (this._filteredApps.indexOf(stream.get_name()) !== -1) {
                return
            }
        } else if (this._filterMode === "allow") {
            if (this._filteredApps.indexOf(stream.get_name()) === -1) {
                return
            }
        }
        
        const slider = new ApplicationStreamSlider(stream, { showDesc: this._showStreamDesc, showIcon: this._showStreamIcon })
        this._applicationStreams[id] = slider
        // this.addMenuItem(this._applicationStreams[id].item)
        // this.add(this.item.actor)
        // log(id)
        // imports.ui.main.__test = id
        // this.addMenuItem(slider)
        // let test = 
        this.addMenuItem(slider)
        // volumeMixer.actor.add(this._applicationStreams[id].item.actor)
        // this.box.add_child(this._applicationStreams[id].item.actor)
        // this.actor.add_child(this._applicationStreams[id].item.actor)
    }

    _streamRemoved(_control, id) {
        if (id in this._applicationStreams) {
            this._applicationStreams[id].item.destroy()
            delete this._applicationStreams[id]
        }
    }

    _updateStreams() {
        for (const id in this._applicationStreams) {
            this._applicationStreams[id].item.destroy()
            delete this._applicationStreams[id]
        }
        
        this._filteredApps = this.settings.get_strv("filtered-apps")
        this._filterMode = this.settings.get_string("filter-mode")
        this._showStreamDesc = this.settings.get_boolean("show-description")
        this._showStreamIcon = this.settings.get_boolean("show-icon")

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
