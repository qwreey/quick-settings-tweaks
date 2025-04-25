import Clutter from "gi://Clutter"
import GObject from "gi://GObject"
import GLib from "gi://GLib"
import Pango from "gi://Pango"
import St from "gi://St"
import * as Main from "resource:///org/gnome/shell/ui/main.js"
/// @ts-expect-error
import {formatTime} from "resource:///org/gnome/shell/misc/dateUtils.js"
import { WeatherClient } from "resource:///org/gnome/shell/misc/weather.js"
import GWeather from "gi://GWeather"
import { FeatureBase, type SettingLoader } from "../../libs/shell/feature.js"
import Global from "../../global.js"
import { VerticalProp } from "../../libs/shell/compat.js"

// #region Client
class Client extends WeatherClient {
	getInfos(maxForecasts: number, intervalHour: number): GWeather.Info[] {
		const infos = []
		const forecasts = this.info.get_forecast_list()
		const now = GLib.DateTime.new_now_local()
		let current = GLib.DateTime.new_from_unix_local(0)
		for (let i = 0; i < forecasts.length; i++) {
			const [valid, timestamp] = forecasts[i].get_value_update()
			if (!valid || timestamp === 0) {
				continue // 0 means 'never updated'
			}
			const datetime = GLib.DateTime.new_from_unix_local(timestamp)
			if (now.difference(datetime) > 0) {
				continue // Ignore earlier forecasts
			}
			if (datetime.difference(current) < GLib.TIME_SPAN_HOUR * intervalHour) {
				continue // Enforce a minimum interval of 1h
			}
			if (infos.push(forecasts[i]) === maxForecasts) {
				break // Use a maximum of five forecasts
			}
			current = datetime
		}
		return infos
	}
	getBestCurrentLocationName(): string {
		return this.getBestLocationName(this.info.get_location())
	}
	getBestLocationName(loc: GWeather.Location): string {
		/// @ts-expect-error
		const locName = loc.get_name()
		if (
			/// @ts-expect-error
			loc.get_level() === GWeather.LocationLevel.CITY
			/// @ts-expect-error
			|| !loc.has_coords()
		) return locName
		/// @ts-expect-error
		const world = GWeather.Location.get_world()
		/// @ts-expect-error
		const city = world.find_nearest_city(...loc.get_coords())
		const cityName = city.get_name()
		return locName.includes(cityName) ? cityName : locName
	}
}
// #endregion Client

// #region Header
class Header extends St.BoxLayout {
	_headerLabel: St.Label
	_locationLabel: St.Label
	_client: Client
	_options: Header.Options
	constructor(client: Client, options: Header.Options) {
		super(client as any, options as any)
	}
	_init(client: Client, options: Header.Options) {
		this._options = options
		this._client = client
		super._init({
			style_class: "QSTWEAKS-header"
		} as Partial<St.BoxLayout.ConstructorProps>)

		// Labels
		this._headerLabel = new St.Label({
			text: _("Weather"),
			style_class: "QSTWEAKS-header-label",
			y_align: Clutter.ActorAlign.CENTER,
			x_align: true,
			x_expand: true,
		})
		this._locationLabel = new St.Label({
			style_class: "QSTWEAKS-location-label",
			y_align: Clutter.ActorAlign.CENTER,
			opacity: 190,
		})
		this.add_child(this._headerLabel)
		this.add_child(this._locationLabel)

		// Client connection
		client.connectObject("changed", this._sync.bind(this), this)
		this._sync.bind(this)
	}
	_sync() {
		if (
			this._locationLabel.visible =
				this._options.showLocation
				&& this._client.hasLocation
		) {
			this._locationLabel.text = this._client.getBestCurrentLocationName()
		}
	}
}
GObject.registerClass(Header)
namespace Header {   
	export type Options = {
		showLocation: boolean,
	}
}
// #endregion Header

// #region WeatherSection
class WeatherSection extends St.Button {
	_client: Client
	_grid: St.Widget
	_layout: Clutter.GridLayout
	_options: WeatherSection.Options
	constructor(client: Client, options: WeatherSection.Options) {
		super(client as any, options as any)
	}
	_init(client: Client, options: WeatherSection.Options) {
		this._client = client
		this._options = options
		super._init({
			style_class: "weather-button message",
			can_focus: true,
			x_expand: true,
		})
		const box = this.child = new St.BoxLayout({
			...VerticalProp,
			style_class: "weather-box",
			x_expand: true,
		})
		const layout = this._layout = new Clutter.GridLayout({
			orientation: Clutter.Orientation.VERTICAL,
		})
		const grid = this._grid = new St.Widget({
			style_class: "weather-grid",
			layout_manager: layout,
		})
		// @ts-expect-error
		layout.hookup_style(grid)
		box.add_child(grid)
		client.connectObject("changed", this._sync.bind(this))
		this._sync()
		this.connect("clicked", this._click.bind(this))
	}
	_addForecast(forecast: GWeather.Info, col: number) {
		const [, timestamp] = forecast.get_value_update()
		const timeStr = formatTime(new Date(timestamp * 1000), {
			timeOnly: true,
			ampm: false,
		})
		const [, tempValue] = forecast.get_value_temp(GWeather.TemperatureUnit.DEFAULT)
		const tempPrefix = Math.round(tempValue) >= 0 ? " " : ""

		const time = new St.Label({
			style_class: "weather-forecast-time",
			text: timeStr,
			x_align: Clutter.ActorAlign.CENTER,
		})
		const icon = new St.Icon({
			style_class: "weather-forecast-icon",
			icon_name: forecast.get_symbolic_icon_name(),
			x_align: Clutter.ActorAlign.CENTER,
			x_expand: true,
		})
		const temp = new St.Label({
			style_class: "weather-forecast-temp",
			text: `${tempPrefix}${Math.round(tempValue)}°`,
			x_align: Clutter.ActorAlign.CENTER,
		})

		temp.clutter_text.ellipsize = Pango.EllipsizeMode.NONE
		time.clutter_text.ellipsize = Pango.EllipsizeMode.NONE

		this._layout.attach(time, col, 0, 1, 1)
		this._layout.attach(icon, col, 1, 1, 1)
		this._layout.attach(temp, col, 2, 1, 1)
	}
	_updateForecasts() {
		const infos = this._client.getInfos(
			this._options.maxForecasts,
			this._options.intervalHour
		)

		// RTL support
		if (this._grid.text_direction === Clutter.TextDirection.RTL) {
			infos.reverse()
		}

		let col = 0
		for (const forecast of infos) {
			if (!forecast.is_valid()) continue
			this._addForecast(forecast, col)
			col++
		}
	}
	_setStatusLabel(text: string) {
		let layout = this._grid.layout_manager
		let label = new St.Label({
			text,
			style_class: "QSTWEAKS-status-label",
		})
		/// @ts-expect-error
		layout.attach(label, 0, 0, 1, 1)
	}
	_sync() {
		this._grid.destroy_all_children()
		if (!this._client.available) {
			this._setStatusLabel((_)("Weather Information Unavailable"))
			return
		}
		if (!this._client.hasLocation) {
			this._setStatusLabel(_("Location has not been set"))
			return
		}
		if (this._client.loading) {
			this._setStatusLabel((_)("Loading…"))
			return
		}
		const info = this._client.info
		if (info.is_valid()) {
			this._updateForecasts()
			return
		}
		if (info.network_error()) {
			this._setStatusLabel((_)("Go Online for Weather Information"))
		} else {
			this._setStatusLabel((_)("Weather Information Unavailable"))
		}
	}
	// Show weather app
	_click() {
		const command = this._options.clickCommand
		if (command) {
			GLib.spawn_async(null, ['sh', '-c', command], null, GLib.SpawnFlags.SEARCH_PATH, null)
		} else {
			this._client.activateApp()
		}
		Main.overview.hide()
		Main.panel.closeCalendar()
	}
}
GObject.registerClass(WeatherSection)
namespace WeatherSection {
	export type Options = {
		maxForecasts: number,
		intervalHour: number,
		clickCommand: string,
	} & Header.Options
}
// #endregion WeatherSection

// #region WeatherWidget
class WeatherWidget extends St.BoxLayout {
	_item: St.Button
	_header: Header
	_client: Client
	_options: WeatherWidget.Options
	constructor(options: WeatherWidget.Options) {
		super(options as any)
	}
	_init(options: WeatherWidget.Options) {
		this._options = options
		const client = this._client = new Client()
		super._init({
			...VerticalProp,
		})

		this.add_child(
			this._header = new Header(client, options)
		)
		this.add_child(
			this._item = new WeatherSection(client, options)
		)

		// Sync changes
		this._client.connectObject(
			"changed",
			this._updateStyleClass.bind(this),
			this
		)
		this._updateStyleClass()
	}
	_updateStyleClass(): void {
		const options = this._options
		let style = "QSTWEAKS-weather"
		if (options.removeShadow) style += " QSTWEAKS-weather-remove-shadow"
		if (options.compact) style += " QSTWEAKS-weather-compact"
		this.styleClass = style
	}

	// Update weather client when widget shown
	vfunc_map() {
		this._client.update()
		super.vfunc_map()
	}
}
GObject.registerClass(WeatherWidget)
namespace WeatherWidget {
	export type Options = {
		compact: boolean
		removeShadow: boolean
	} & WeatherSection.Options
}
// #endregion WeatherWidget

// #region WeatherWidgetFeature
export class WeatherWidgetFeature extends FeatureBase {
	// #region settings
	enabled: boolean
	compact: boolean
	removeShadow: boolean
	clickCommand: string
	header: boolean
	maxForecasts: number
	intervalHour: number
	showLocation: boolean
	override loadSettings(loader: SettingLoader): void {
		this.enabled = loader.loadBoolean("weather-enabled")
		this.removeShadow = loader.loadBoolean("weather-remove-shadow")
		this.compact = loader.loadBoolean("weather-compact")
		this.clickCommand = loader.loadString("weather-click-command")
		this.header = loader.loadBoolean("weather-show-header")
		this.showLocation = loader.loadBoolean("weather-show-location")
		this.maxForecasts = loader.loadInt("weather-max-forecasts")
		this.intervalHour = loader.loadInt("weather-interval-hour")
	}
	// #endregion settings

	weatherWidget: WeatherWidget
	override reload(key: string): void {
		switch (key) {
			case "weather-compact":
			case "weather-remove-shadow":
				if (!this.enabled) return
				this.weatherWidget!._updateStyleClass()
				break
			case "weather-click-command":
				break
			default:
				super.reload()
				break
		}
	}
	override onLoad(): void {
		if (!this.enabled) return
		this.maid.destroyJob(
			this.weatherWidget = new WeatherWidget(this)
		)

		Global.QuickSettingsGrid.add_child(this.weatherWidget)
		Global.QuickSettingsGrid.layout_manager.child_set_property(
			Global.QuickSettingsGrid, this.weatherWidget, "column-span", 2
		)
	}
	override onUnload(): void {
		this.weatherWidget = null
	}
}
// #endregion WeatherWidgetFeature
