import St from "gi://St"
import Clutter from "gi://Clutter"
import * as Mpris from "resource:///org/gnome/shell/ui/mpris.js"
import { Slider } from 'resource:///org/gnome/shell/ui/slider.js'
import GObject from "gi://GObject"
import GLib from "gi://GLib"
import { logger } from "../libs/utility.js"
import { Global } from "../global.js"
import Gio from "gi://Gio"

// #region ProgressControl
interface ProgressControl {
    _positionLabel: St.Label
    _lengthLabel: St.Label
    _slider: Slider
    _player: Player
    _positionTracker: number|null
    _dragging: boolean
    _shown: boolean
}
class ProgressControl extends St.BoxLayout {
    constructor(player: Player) {
        super(player as any)
    }
    _init(player: Player): void {
        this._player = player
        this._positionTracker = null
        this._dragging = false
        this._shown = false

        super._init({
            vertical: false,
            x_expand: true,
            style_class: "QSTWEAKS-progress-control",
        })

        this._createLabels()
        this._createSlider()

        this.add_child(this._positionLabel)
        this.add_child(this._slider)
        this.add_child(this._lengthLabel)

        this.connect("notify::mapped", this._updateTracker.bind(this))
        this.connect("destroy", this._dropTracker.bind(this))
        this._player.connectObject("changed", () => this._updateStatus(), this)
    }

    _createLabels() {
        this._positionLabel = new St.Label({
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
            style_class: "QSTWEAKS-position-label",
        })
        this._lengthLabel = new St.Label({
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
            style_class: "QSTWEAKS-length-label",
        })
    }
    _createSlider() {
        this._slider = new Slider(0)

        // Process Dragging
        this._slider.connect("drag-begin", () => {
            this._dragging = true
            return Clutter.EVENT_PROPAGATE
        });
        this._slider.connect("drag-end", () => {
            this._player.position = (Math.floor(this._slider.value) * 1000000)
            this._dragging = false
            return Clutter.EVENT_PROPAGATE
        })
        this._slider.connect("scroll-event", () => {
            return Clutter.EVENT_STOP
        })
        this._slider.connect("notify::value", () => {
            if (this._dragging) this._updatePosition(Math.floor(this._slider.value) * 1000000)
        })
    }

    // Show / Hide by playing status
    _updateStatus(noAnimate?: boolean) {
        if (!this.mapped) return
        this._shown = this._player.status === 'Playing'
        if (this._shown) this._trackPosition()
        const previousHeight = this.height
        this.height = -1
        const height = this._shown ? this.get_preferred_height(-1)[0] : 0
        this.height = previousHeight
        const opacity = this._shown ? 255 : 0
        if (noAnimate) {
            this.remove_all_transitions()
            this.height = height
            this.opacity = opacity
            return
        }
        // @ts-expect-error
        if (this._shown) {
            this.ease({
                height,
                duration: 150,
                onComplete: ()=>{
                    this.ease({
                        opacity,
                        duration: 150,
                    })
                }
            })
        } else {
            this.ease({
                opacity,
                duration: 200,
                onComplete: ()=>{
                    this.ease({
                        height,
                        duration: 150,
                    })
                }
            })
        }
    }

    // Update slider and label
    _updatePosition(current: number) {
        const currentSeconds = current / 1000000
        const lengthSeconds = this._player.length / 1000000
        this._positionLabel.text = this._formatSeconds(currentSeconds)
        this._lengthLabel.text = this._formatSeconds(lengthSeconds)
        this._slider.overdriveStart = this._slider.maximumValue = lengthSeconds
        this._slider.value = currentSeconds
    }

    // Use polling to update position when only shown
    _trackPosition() {
        this._slider.reactive = this._player.canSeek
        if (this._shown && !this._dragging) {
            this._player.position.then(this._updatePosition.bind(this))
        }
        return GLib.SOURCE_CONTINUE;
    }
    _dropTracker() {
        if (this._positionTracker === null) return
        GLib.source_remove(this._positionTracker)
        this._positionTracker = null
    }
    _createTracker() {
        this._positionTracker = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, this._trackPosition.bind(this))
    }
    _updateTracker() {
        if (this.mapped) this._createTracker()
        else this._dropTracker()
        this._updateStatus(true)
    }

    // Seconds => HH:MM:SS or MM:SS
    _formatSeconds(seconds: number) {
        const minutes = Math.floor(seconds / 60) % 60
        const hours = Math.floor(seconds / 3600) % 60
        seconds %= 60

        const secondsPadded = seconds.toString().padStart(2, "0")
        const minutesPadded = minutes.toString().padStart(2, "0")

        if (hours > 0) return `${hours}:${minutesPadded}:${secondsPadded}`
        return `${minutes}:${secondsPadded}`
    }
}
GObject.registerClass(ProgressControl)
// #endregion ProgressControl

// #region Player
interface Player {
    _length: number | null
    _propertiesProxy: Gio.DBusProxy
    _seekProxy: Gio.DBusProxy
    _isPropertiesProxyReady: boolean
    _canSeek: boolean
    _trackid: string
}
class Player extends Mpris.MprisPlayer {
    constructor(busName: string) {
        super(busName)

        // Create properties proxy for Position & CanSeek
        const propertiesIface = Global.GetDbusInterface("media/dbus.xml","org.freedesktop.DBus.Properties")
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

        // Create proxy for seeking
        const seekIface = Global.GetDbusInterface("media/dbus.xml","org.mpris.MediaPlayer2.Player")
        Gio.DBusProxy.new(
            Gio.DBus.session,
            Gio.DBusProxyFlags.NONE,
            seekIface,
            busName,
            '/org/mpris/MediaPlayer2',
            seekIface.name,
            null,
        // @ts-expect-error
        ).then((proxy: Gio.DbusProxy) => this._seekProxy = proxy)
    }

    get position(): Promise<number|null> {
        return this._propertiesProxy.GetAsync(
            "org.mpris.MediaPlayer2.Player",
            "Position"
        ).then((result: any) => {
            return result[0].get_int64()
        }).catch( ()=> null)
    }
    set position(value: number) {
        this._seekProxy.SetPositionAsync(
            this.trackId,
            Math.min(this.length, Math.max(1, value))
        ).catch(logger)
    }
    get trackId(): string {
        return this._trackid
    }
    get canSeek(): boolean {
        return this._canSeek
    }
    get length(): number|null {
        return this._length
    }
    _updateState() {
        const metadata = (this as any)._playerProxy.Metadata
        this._length = metadata?.["mpris:length"]?.get_int64() ?? null
        this._trackid = metadata?.["mpris:trackid"]?.get_string()[0]

        this._propertiesProxy.GetAsync(
            "org.mpris.MediaPlayer2.Player",
            "CanSeek"
        ).then((result: any) => {
            this._canSeek = result[0].get_boolean()
        }).finally(()=>{
            super._updateState()
        })
    }

    _close() {
        this._propertiesProxy = null
        this._seekProxy = null
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
