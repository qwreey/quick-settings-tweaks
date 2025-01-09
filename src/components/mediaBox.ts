import St from "gi://St"
import Clutter from "gi://Clutter"
import * as Mpris from "resource:///org/gnome/shell/ui/mpris.js"
import { Slider } from 'resource:///org/gnome/shell/ui/slider.js'
import GObject from "gi://GObject"
import GLib from "gi://GLib"
import { logger } from "../libs/utility.js"
import { Global } from "../global.js"
import Gio from "gi://Gio"


// export class ProgressBar extends Slider {
//     _init(value, manager, busName, timestamps) {
//         super._init(value)

//         this._busName = busName
//         this.manager = manager
//         this.timestamps = timestamps
//         this._updateSettings()
//         this.updateSignal = St.Settings.get().connect('notify', () => this._updateSettings())
//         this._length = 1

//         this.signals = []

//         this._initProxy()

//         timeout = setInterval(() => {
//             if (this._dragging)
//                 return
//             if (!this) {
//                 this.destroy()
//                 return
//             }
//             if (!this.length)
//                 this._updateInfo()

//             let position = this.getProperty("Position")

//             this.value = position / this._length
//             position = position / 1000000
//             let text = new Date(0)
//             text.setUTCSeconds(position)
//             this.timestamps[0].set_text(text.toISOString().substring(11, 19).replace(/^0(?:0:0?)?/, ''))
//         }, 1000)

//         this.signals.push(this.connect("drag-end", () => {
//             if (this._dragging)
//                 return
//             this.setPosition(this.value * this._length)
//         }))
//     }

//     _updateInfo() {
//         if (!this._playerProxy)
//             this._initProxy()
//         this._trackId = this.getProperty("Metadata")['mpris:trackid']
//         if (!this._trackId)
//             this.reactive = false
//         if (this._trackId !== 0 && this.getProperty("CanSeek"))
//             this.reactive = true
//         this._length = this.getProperty("Metadata")['mpris:length']
//         if (!this._length) {
//             this.visible = false
//             this.timestamps[0].visible = false
//             this.timestamps[1].visible = false
//             return
//         } else {
//             this.visible = true
//             this.timestamps[0].visible = true
//             this.timestamps[1].visible = true
//         }

//         let position = this._length / 1000000
//         let text = new Date(0)
//         text.setUTCSeconds(position)
//         this.timestamps[1].set_text(text.toISOString().substring(11, 19).replace(/^0(?:0:0?)?/, ''))
//     }

//     getProperty(prop) {
//         try {
//             return this._playerProxy.get_connection().call_sync(
//                 this._busName,
//                 "/org/mpris/MediaPlayer2",
//                 "org.freedesktop.DBus.Properties",
//                 "Get",
//                 new GLib.Variant("(ss)", ["org.mpris.MediaPlayer2.Player", prop]),
//                 null,
//                 Gio.DBusCallFlags.NONE,
//                 50,
//                 null
//             ).recursiveUnpack()[0]
//         } catch {
//             return 0
//         }
//     }

//     setPosition(value) {
//         this._playerProxy.get_connection().call_sync(
//             this._busName,
//             "/org/mpris/MediaPlayer2",
//             "org.mpris.MediaPlayer2.Player",
//             "SetPosition",
//             new GLib.Variant("(ox)", [this._trackId, value.toString()]),
//             null,
//             Gio.DBusCallFlags.NONE,
//             50,
//             null
//         )
//     }

//     _onPlayerProxyReady() {
//         this._playerProxy.connectObject('g-properties-changed', () => this._updateInfo(), this)
//         this._updateInfo()
//     }

//     _updateSettings() {
//         if (St.Settings.get().color_scheme === 0 && GLib.get_os_info("NAME").includes("Ubuntu")) {
//             this.remove_style_class_name('progress-bar')
//             this.add_style_class_name('progress-bar-light')
//         } else if (St.Settings.get().color_scheme === 2) {
//             this.remove_style_class_name('progress-bar')
//             this.add_style_class_name('progress-bar-light')
//         } else {
//             this.remove_style_class_name('progress-bar-light')
//             this.add_style_class_name('progress-bar')
//         }

//     }

//     _initProxy() {
//         try {
//             const MprisPlayerIface = loadInterfaceXML('org.mpris.MediaPlayer2.Player')
//             const MprisPlayerProxy = Gio.DBusProxy.makeProxyWrapper(MprisPlayerIface)

//             this._playerProxy = MprisPlayerProxy(Gio.DBus.session, this._busName, '/org/mpris/MediaPlayer2', this._onPlayerProxyReady.bind(this))
//         } catch { }
//     }

//     destroy() {
//         this.signals.map((i) => {
//             this.disconnect(i)
//         })
//         this._playerProxy.disconnectObject(this)
//         St.Settings.get().disconnect(this.updateSignal)
//         clearInterval(timeout)
//         this._playerProxy = null
//         this.timestamps[0].destroy()
//         this.timestamps[1].destroy()
//         if (this.manager.bars[this._busName])
//             delete this.manager.bars[this._busName]
//         super.destroy()
//     }
// }

class ProgressSlider extends Slider {
    _init(value) {
        super._init(value)
    }
}
GObject.registerClass(ProgressSlider)

interface ProgressControl {
    _progressLabel: St.Label
    _lengthLabel: St.Label
    _slider: ProgressSlider
    _player: Player
    _positionTracker: number|null
}
class ProgressControl extends St.BoxLayout {
    constructor(player: Player) {
        super(player as any)
    }
    _init(player: Player): void {
        this._player = player
        this._positionTracker = null

        super._init({
            vertical: false,
            x_expand: true,
        })

        this._progressLabel = new St.Label({
            text: "test",
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
            style_class: "QSTWEAKS-progress-label",
        })
        this.add_child(this._progressLabel)

        this._slider = new ProgressSlider(20)
        this.add_child(this._slider)

        this._lengthLabel = new St.Label({
            text: "test",
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
            style_class: "QSTWEAKS-length-label",
        })
        this.add_child(this._lengthLabel)

        this.connect("notify::mapped", this._updateTracker.bind(this))
        this.connect("destroy", this._dropTracker.bind(this))
    }

    _updatePosition() {
        this._player._propertiesProxy.GetAsync(
            "org.mpris.MediaPlayer2.Player",
            "Position"
        ).then(result => {
            logger(result[0].get_int64())
        })
        return GLib.SOURCE_CONTINUE;
    }
    _dropTracker() {
        if (this._positionTracker === null) return
        GLib.source_remove(this._positionTracker)
        this._positionTracker = null
    }
    _createTracker() {
        this._updatePosition()
        this._positionTracker = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, this._updatePosition.bind(this))
    }
    _updateTracker() {
        if (this.mapped) this._createTracker()
        else this._dropTracker()
    }
}
GObject.registerClass(ProgressControl)

// #region Player
interface Player {
    _propertiesProxy: Gio.DBusProxy
    _isPropertiesProxyReady: boolean
}
class Player extends Mpris.MprisPlayer {
    constructor(busName: string) {
        super(busName)

        const propertiesIface = Global.GetDbusInterface("media/dbus-properties.xml","org.freedesktop.DBus.Properties")
        Gio.DBusProxy.new(
            Gio.DBus.session,
            Gio.DBusProxyFlags.NONE,
            propertiesIface,
            busName,
            '/org/mpris/MediaPlayer2',
            propertiesIface.name,
            null,
        // @ts-expect-error
        ).then((proxy: Gio.DbusProxy) => this._propertiesProxy = proxy)
    }

    _close() {
        this._propertiesProxy = null
        super._close()
    }
}
// #endregion Player

// #region MediaItem
class MediaItem extends Mpris.MediaMessage {
    constructor(player: Player) {
        super(player)
        this.child.add_child(new ProgressControl(player))
    }
}
GObject.registerClass(MediaItem)
// #endregion MediaItem

// #region MediaList
class MediaList extends Mpris.MediaSection {
    _init() {
        super._init()
    }

    // Override and bind custom message
    // See: https://github.com/GNOME/gnome-shell/blob/c58b826788f99bc783c36fa44e0e669dee638f0e/js/ui/mpris.js#L264
    _addPlayer(busName) {
        if (this._players.get(busName))
            return

        let player = new Player(busName)
        let message = null
        player.connect('closed',
            () => {
                this._players.delete(busName)
            })
        player.connect('show', () => {
            message = new MediaItem(player) // modified
            this.addMessage(message, true)
        })
        player.connect('hide', () => {
            this.removeMessage(message, true)
            message = null
        })

        this._players.set(busName, player)
    }
}
GObject.registerClass(MediaList)
// #endregion MediaList

// #region Header
namespace Header {   
    export type Options = Partial<{
    } & St.BoxLayout.ConstructorProps>
}
interface Header {
    _headerLabel: St.Label
}
class Header extends St.BoxLayout {
    constructor(options: Header.Options) {
        super(options)
    }
    _init(options: Header.Options) {
        super._init({
            style_class: "QSTWEAKS-header"
        } as Partial<St.BoxLayout.ConstructorProps>)

        // Label
        this._headerLabel = new St.Label({
            text: _('Media'),
            style_class: "QSTWEAKS-header-label",
            y_align: Clutter.ActorAlign.CENTER,
            x_align: Clutter.ActorAlign.START,
            x_expand: true
        })
        this.add_child(this._headerLabel)
    }
}
GObject.registerClass(Header)
// #endregion Header

// #region MediaBox
namespace MediaBox {
    export type Options = Partial<{

    } & St.BoxLayout.ConstructorProps>
}
interface MediaBox {
    _options: MediaBox.Options
    _scroll: St.ScrollView
    _list: MediaList
    _header: Header
    _sections: St.BoxLayout
}
class MediaBox extends St.BoxLayout {
    constructor(options: MediaBox.Options) {
        super(options)
    }
    _init(options) {
        super._init({
            vertical: true,
            x_expand: true,
            y_expand: true,
        })
        this._options = options

        this._header = new Header({})
        this.add_child(this._header)

        this._createMediaScroll()
        this.add_child(this._scroll)

        this._list.connect('notify::empty', this._syncEmpty.bind(this))
        this._syncEmpty()
    }

    _createMediaScroll() {
        this._sections = new St.BoxLayout({
            vertical: false,
            x_expand: true,
        })
        this._scroll = new St.ScrollView({
            x_expand: true,
            y_expand: true,
            hscrollbar_policy: St.PolicyType.EXTERNAL,
            vscrollbar_policy: St.PolicyType.NEVER,
            child: this._sections,
        })
        this._list = new MediaList()
        this._sections.add_child(this._list)
    }

    _syncEmpty() {
        this.visible = !this._list.empty
    }
}
GObject.registerClass(MediaBox)
export { MediaBox }
// #endregion MediaBox
