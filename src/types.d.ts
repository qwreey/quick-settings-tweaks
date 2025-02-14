import "@girs/gnome-shell/ambient"
import "@girs/gnome-shell/extensions/global"
import "@girs/gjs/dom"
import "@girs/gjs"
import "./ambient"

// Shell environment
// import Clutter from "@girs/clutter-15/clutter-15"
// import GObject from "gi://GObject"
// import Atk from "gi://Atk"
declare module "@girs/clutter-15/clutter-15" {
    namespace Clutter {
        interface Actor {
            ease(params: EasingParamsWithProps): void
            ease_property(propName: string, target: any, params: EasingParams)
        }
    }
}
declare module "@girs/gobject-2.0/gobject-2.0" {
    import SignalTracker from "resource:///org/gnome/shell/misc/signals.js"
    namespace GObject {
        interface Object {
            connectObject: SignalTracker.EventEmitter["connectObject"]
            connect_object: SignalTracker.EventEmitter["connectObject"]
            disconnectObject: SignalTracker.EventEmitter["disconnectObject"]
            disconnect_object: SignalTracker.EventEmitter["disconnectObject"]
        }
    }
}
