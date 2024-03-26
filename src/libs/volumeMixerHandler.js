import { StreamSlider } from "./streamSlider.js"

import St from "gi://St"
import Gvc from "gi://Gvc"

import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js"
import * as Volume from "resource:///org/gnome/shell/ui/status/volume.js"

export const VolumeMixer = class VolumeMixer extends PopupMenu.PopupMenuSection {
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
        this._useRegex = settings["volume-mixer-use-regex"]
        this._checkDescription = settings["volume-mixer-check-description"]

        this._updateStreams()
    }

    _checkMatch(str,matchStr) {
        if (!str) return
        if (matchStr instanceof RegExp) return str.match(matchStr)
        return str === matchStr
    }

    _streamAdded(control, id) {
        
        if (id in this._applicationStreams) {
            return
        }

        const stream = control.lookup_stream_id(id)

        if (stream.is_event_stream || !(stream instanceof Gvc.MixerSinkInput)) {
            return
        }

        let name = stream.get_name()
        let description = stream.get_description()

        let hasFiltered = false
        for (const matchStr of this._filteredApps) {
            let matchExp = this._useRegex ? new RegExp(matchStr) : matchStr
            if (
                // Check name
                this._checkMatch(name,matchExp) 
                // Check description
                || this._checkDescription && this._checkMatch(description,matchExp)
            ) { hasFiltered = true; break }
        }
        if (this._filterMode === "block" && hasFiltered) return
        if (this._filterMode === "allow" && !hasFiltered) return

        const slider = new StreamSlider(Volume.getMixerControl())
        slider.stream = stream
        slider.style_class = slider.style_class + " QSTWEAKS-volume-mixer-slider"
        this._applicationStreams[id] = slider
        if (this._showStreamIcon) {
            slider._icon.icon_name = stream.get_icon_name()
        }

        if (name || description) {
            slider._vbox = new St.BoxLayout();
            slider._vbox.vertical = true;

            let sliderBox = slider.first_child
            let lastObj = sliderBox.last_child // expend button. not needed
            let sliderObj = sliderBox.get_children()[1]
            sliderBox.remove_child(sliderObj)
            sliderBox.remove_child(lastObj)
            sliderBox.add_child(slider._vbox)
            
            slider._label = new St.Label({ x_expand: true })
            slider._label.style_class = "QSTWEAKS-volume-mixer-label"
            slider._label.text = name && this._showStreamDesc ? `${name} - ${description}` : (name || description)
            slider._vbox.add_child(slider._label)
            slider._vbox.add_child(sliderObj)
        }

        this.actor.add_child(slider)
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
