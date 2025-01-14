import GObject from "gi://GObject"
import St from "gi://St"
import { Global } from "../global.js"

// #region WeatherWidget
class WeatherWidget extends St.BoxLayout {
    _item: St.BoxLayout
    _init() {
        super._init()

        this.add_child(
            this._item = new (Global.DateMenu as any)._weatherItem.constructor()
        )
    }
}
GObject.registerClass(WeatherWidget)
export { WeatherWidget }
// #endregion WeatherWidget
