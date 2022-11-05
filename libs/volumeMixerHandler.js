const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const { StreamSlider } = Me.imports.libs.streamSlider

const { BoxLayout, Label } = imports.gi.St
const { Settings, SettingsSchemaSource } = imports.gi.Gio
const { MixerSinkInput } = imports.gi.Gvc

const PopupMenu = imports.ui.popupMenu // https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/popupMenu.js
const Volume = imports.ui.status.volume // https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/status/volume.js

var VolumeMixer = class VolumeMixer extends PopupMenu.PopupMenuSection {
    constructor(settings) {
        super()
        this._applicationStreams = {}
        this._applicationMenus = {}
        
        this._control = Volume.getMixerControl()
        this._streamAddedEventId = this._control.connect("stream-added", this._streamAdded.bind(this))
        this._streamRemovedEventId = this._control.connect("stream-removed", this._streamRemoved.bind(this))

        this._filteredApps = settings["volume-mixer-filtered-apps"]
        this._filterMode = settings["volume-mixer-filter-mode"]
        this._showStreamDesc = settings["volume-mixer-show-description"]
        this._showStreamIcon = settings["volume-mixer-show-icon"]

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

        const slider = new StreamSlider(Volume.getMixerControl())
        slider.stream = stream
        slider.style_class = slider.style_class + " QSTWEAKS-volume-mixer-slider"
        this._applicationStreams[id] = slider
        if (this._showStreamIcon) {
            slider._icon.icon_name = stream.get_icon_name()
        }

        let name = stream.get_name()
        let description = stream.get_description()

        if (name || description) {
            slider._vbox = new BoxLayout();
            slider._vbox.vertical = true;

            let sliderBox = slider.first_child
            let lastObj = sliderBox.last_child // expend button. not needed
            let sliderObj = sliderBox.get_children()[1]
            sliderBox.remove_child(sliderObj)
            sliderBox.remove_child(lastObj)
            sliderBox.add(slider._vbox)
            
            slider._label = new Label({ x_expand: true })
            slider._label.style_class = "QSTWEAKS-volume-mixer-label"
            slider._label.text = name && this._showStreamDesc ? `${name} - ${description}` : (name || description)
            slider._vbox.add(slider._label)
            slider._vbox.add(sliderObj)
        }

        this.actor.add(slider)
        slider.visible = true
    }

    _streamRemoved(_control, id) {
        if (id in this._applicationStreams) {
            this._applicationStreams[id].destroy()
            delete this._applicationMenus[id]
        }
    }

    _updateStreams() {
        for (const id in this._applicationStreams) {
            this._applicationStreams[id].destroy()
            delete this._applicationMenus[id]
        }

        for (const stream of this._control.get_streams()) {
            this._streamAdded(this._control, stream.get_id())
        }
    }

    destroy() {
        // Destroy all of sliders
        for (const id in this._applicationStreams) {
            this._applicationStreams[id].destroy()
            delete this._applicationMenus[id]
        }

        this._control.disconnect(this._streamAddedEventId)
        this._control.disconnect(this._streamRemovedEventId)
        super.destroy()
    }
}
