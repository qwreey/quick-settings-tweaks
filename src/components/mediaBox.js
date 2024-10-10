import * as Mpris from "resource:///org/gnome/shell/ui/mpris.js"
import { Slider } from 'resource:///org/gnome/shell/ui/slider.js'

new Mpris.MediaSection()

export class ProgressBar extends Slider {
    _init(value, manager, busName, timestamps) {
        super._init(value)

        this._busName = busName
        this.manager = manager
        this.timestamps = timestamps
        this._updateSettings()
        this.updateSignal = St.Settings.get().connect('notify', () => this._updateSettings())
        this._length = 1

        this.signals = []

        this._initProxy()

        timeout = setInterval(() => {
            if (this._dragging)
                return
            if (!this) {
                this.destroy()
                return
            }
            if (!this.length)
                this._updateInfo()

            let position = this.getProperty("Position")

            this.value = position / this._length
            position = position / 1000000
            let text = new Date(0)
            text.setUTCSeconds(position)
            this.timestamps[0].set_text(text.toISOString().substring(11, 19).replace(/^0(?:0:0?)?/, ''))
        }, 1000)

        this.signals.push(this.connect("drag-end", () => {
            if (this._dragging)
                return
            this.setPosition(this.value * this._length)
        }))
    }

    _updateInfo() {
        if (!this._playerProxy)
            this._initProxy()
        this._trackId = this.getProperty("Metadata")['mpris:trackid']
        if (!this._trackId)
            this.reactive = false
        if (this._trackId !== 0 && this.getProperty("CanSeek"))
            this.reactive = true
        this._length = this.getProperty("Metadata")['mpris:length']
        if (!this._length) {
            this.visible = false
            this.timestamps[0].visible = false
            this.timestamps[1].visible = false
            return
        } else {
            this.visible = true
            this.timestamps[0].visible = true
            this.timestamps[1].visible = true
        }

        let position = this._length / 1000000
        let text = new Date(0)
        text.setUTCSeconds(position)
        this.timestamps[1].set_text(text.toISOString().substring(11, 19).replace(/^0(?:0:0?)?/, ''))
    }

    getProperty(prop) {
        try {
            return this._playerProxy.get_connection().call_sync(
                this._busName,
                "/org/mpris/MediaPlayer2",
                "org.freedesktop.DBus.Properties",
                "Get",
                new GLib.Variant("(ss)", ["org.mpris.MediaPlayer2.Player", prop]),
                null,
                Gio.DBusCallFlags.NONE,
                50,
                null
            ).recursiveUnpack()[0]
        } catch {
            return 0
        }
    }

    setPosition(value) {
        this._playerProxy.get_connection().call_sync(
            this._busName,
            "/org/mpris/MediaPlayer2",
            "org.mpris.MediaPlayer2.Player",
            "SetPosition",
            new GLib.Variant("(ox)", [this._trackId, value.toString()]),
            null,
            Gio.DBusCallFlags.NONE,
            50,
            null
        )
    }

    _onPlayerProxyReady() {
        this._playerProxy.connectObject('g-properties-changed', () => this._updateInfo(), this)
        this._updateInfo()
    }

    _updateSettings() {
        if (St.Settings.get().color_scheme === 0 && GLib.get_os_info("NAME").includes("Ubuntu")) {
            this.remove_style_class_name('progress-bar')
            this.add_style_class_name('progress-bar-light')
        } else if (St.Settings.get().color_scheme === 2) {
            this.remove_style_class_name('progress-bar')
            this.add_style_class_name('progress-bar-light')
        } else {
            this.remove_style_class_name('progress-bar-light')
            this.add_style_class_name('progress-bar')
        }

    }

    _initProxy() {
        try {
            const MprisPlayerIface = loadInterfaceXML('org.mpris.MediaPlayer2.Player')
            const MprisPlayerProxy = Gio.DBusProxy.makeProxyWrapper(MprisPlayerIface)

            this._playerProxy = MprisPlayerProxy(Gio.DBus.session, this._busName, '/org/mpris/MediaPlayer2', this._onPlayerProxyReady.bind(this))
        } catch { }
    }

    destroy() {
        this.signals.map((i) => {
            this.disconnect(i)
        })
        this._playerProxy.disconnectObject(this)
        St.Settings.get().disconnect(this.updateSignal)
        clearInterval(timeout)
        this._playerProxy = null
        this.timestamps[0].destroy()
        this.timestamps[1].destroy()
        if (this.manager.bars[this._busName])
            delete this.manager.bars[this._busName]
        super.destroy()
    }
}