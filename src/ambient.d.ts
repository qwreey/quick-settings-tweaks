// Provide missing types

declare global {
	export interface EasingParams {
		repeatCount?: number
		autoReverse?: boolean
		animationRequired?: boolean
		duration?: number
		delay?: number
		mode?: Clutter.AnimationMode | any
	}
	export type EasingParamsWithProps = EasingParams & { [key: string]: any }
}

declare module "gi://GWeather" {
	import GObject from "gi://GObject"
	class Info extends GObject.Object {
		static store_cache(): void
		constructor(location: Location)
		abort(): void
		get_apparent(): string
		/// Get the application ID of the application fetching the weather
		/** @returns { string } the application ID */
		get_application_id(): string
		/// Some weather services require the application showing the data to include an attribution text, possibly including links to the service website.
		/// This must be shown prominently toghether with the data.
		/** @returns { string } the required attribution text, in Pango markup form, or null if not required */
		get_attribution(): string
		get_conditions(): string
		/// Get the contact information of the application fetching the weather.
		/** @returns { string } the contact information */
		get_contact_info(): string
		get_dew(): string
		/// Gets the bitmask of enabled GWeather.Provider weather providers.
		get_enabled_providers(): Provider
		/**
		 * @returns {Info[]}
		 * list of GWeatherInfo* objects for the forecast.
		 * The list is owned by the 'info' object thus is alive as long as the 'info'.
		 * The 'update' property is the date/time when the forecast info is used for.
		*/
		get_forecast_list(): Info[]
		get_humidity(): string
		get_icon_name(): string
		get_location(): Location
		get_location_name(): string
		get_pressure(): string
		get_sky(): string
		get_sunrise(): string
		get_sunset(): string
		get_symbolic_icon_name(): string
		get_temp(): string
		get_temp_max(): string
		get_temp_min(): string
		get_temp_summary(): string
		get_upcoming_moonphases(phases: number): boolean
		get_update(): string
		/** @param { TemperatureUnit } unit the desired unit, as a GWeather.TemperatureUnit */
		/**
		 * @returns {[boolean, number]}
		 * ok - TRUE is value is valid, FALSE otherwise
		 *
		 * value - the apparent temperature
		*/
		get_value_apparent(unit: TemperatureUnit): [boolean, number]
		/// Fills out phenomenon and qualifier with current weather conditions.
		/**
		 * @returns {[boolean, GWeather.ConditionPhenomenon, GWeather.ConditionQualifier]}
		 * ok - TRUE is out arguments are valid, FALSE otherwise.
		 *
		 * phenomenon - a location for a GWeather.ConditionPhenomenon.
		 *
		 * qualifier - a location for a GWeather.ConditionQualifier.
		*/
		get_value_conditions(): [boolean, ConditionPhenomenon, ConditionQualifier]
		/**
		 * @returns {[boolean, number]}
		 * ok - TRUE is value is valid, FALSE otherwise.
		 *
		 * value - the dew point
		*/
		get_value_dew(unit: TemperatureUnit): [boolean, number]
		/**
		 * @returns {[boolean, MoonPhase, MoonLatitude]}
		 * ok - TRUE is value is valid, FALSE otherwise.
		 *
		 * value - the current moon phase
		 *
		 * lat - the moon declension
		*/
		get_value_moonphase(): [boolean, MoonPhase, MoonLatitude]
		/** @param {PressureUnit} unit the desired unit, as a GWeather.PressureUnit */
		/**
		 * @returns {[boolean, number]}
		 * ok - TRUE if value is valid, FALSE otherwise.
		 *
		 * value - forecasted pressure, expressed in unit
		*/
		get_value_pressure(unit): [boolean, number]
		/**
		 * @returns {[boolean, Sky]}
		 * ok - TRUE is sky is valid, FALSE otherwise.
		 *
		 * sky - a location for a GWeather.Sky.
		*/
		get_value_sky(): [boolean, Sky]
		/**
		 * @returns {[boolean, number]}
		 * ok - TRUE is value is valid, FALSE otherwise.
		 *
		 * value - the time of sunrise
		*/
		get_value_sunrise(): [boolean, number]
		/**
		 * @returns {[boolean, number]}
		 * ok - TRUE is value is valid, FALSE otherwise.
		 *
		 * value - the time of sunset
		*/
		get_value_sunset(): [boolean, number]
		/** @param {TemperatureUnit} unit the desired unit, as a GWeather.TemperatureUnit */
		/**
		 * @returns {[boolean, number]}
		 * ok - TRUE is value is valid, FALSE otherwise.
		 *
		 * value - the temperature value
		*/
		get_value_temp(unit: TemperatureUnit): [boolean, number]
		/** @param {GWeather.TemperatureUnit} unit the desired unit, as a GWeather.TemperatureUnit */
		/**
		 * @returns {[boolean, number]}
		 * ok - TRUE is value is valid, FALSE otherwise.
		 *
		 * value - the maximum temperature value
		*/
		get_value_temp_max(unit: TemperatureUnit): [boolean, number]
		/** @param {GWeather.TemperatureUnit} unit the desired unit, as a GWeather.TemperatureUnit */
		/**
		 * @returns {[boolean, number]}
		 * ok - TRUE is value is valid, FALSE otherwise.
		 *
		 * value - the minimum temperature value
		*/
		get_value_temp_min(unit: TemperatureUnit): [boolean, number]
		/// Note that value may be 0 if this has not yet been updated.
		/**
		 * @returns {[boolean, number]}
		 * ok - TRUE is value is valid, FALSE otherwise.
		 *
		 * value - the time this was last updated
		*/
		get_value_update(): [boolean, number]
		/** @param {GWeather.DistanceUnit} unit the desired unit, as a GWeather.DistanceUnit */
		/**
		 * @returns {[boolean, number]}
		 * ok - TRUE if value is valid, FALSE otherwise.
		 *
		 * value - forecasted visibility, expressed in unit
		*/
		get_value_visibility(unit: DistanceUnit): [boolean, number]
		/** @param {GWeather.SpeedUnit} unit the desired unit, as a GWeather.SpeedUnit */
		/**
		 * @returns {[boolean, number, GWeather.WindDirection]}
		 * ok - TRUE if speed and direction are valid, FALSE otherwise.
		 *
		 * speed - forecasted wind speed
		 *
		 * direction - forecasted wind direction
		*/
		get_value_wind(unit: SpeedUnit): [boolean, number, WindDirection]
		get_visibility(): string
		/** @returns {string} a summary for current weather conditions. */
		get_weather_summary(): string
		get_wind(): string
		/**
		 * @returns {boolean}
		 * Whether it is daytime (that is, if the sun is visible) or not at the location and the point of time referred by this.
		 *
		 * This is mostly equivalent to comparing the return value of GWeather.Info.get_value_sunrise and GWeather.Info.get_value_sunset, but it accounts also for midnight sun and polar night, for locations within the Artic and Antartic circles.
		*/
		is_daytime(): boolean
		is_valid(): boolean
		network_error(): boolean
		next_sun_event(): number
		/// Sets the application ID of the application fetching the weather.
		/// It is a requirement for using any of the online weather providers.
		///
		/// If the application uses Gio.Application, then the application ID will be automatically filled in.
		/** @param {string} application_id the application ID to set
		set_application_id(application_id: string): void

		/// Sets the contact information for the application fetching the weather.
		/// It is a requirement for using any of the online weather providers as it allows API providers to contact application developers in case of terms of use breaches.
		///
		/// The contact information should be an email address, or the full URL to an online contact form which weather providers can use to contact the application developer. Avoid using bug tracker URLs which require creating accounts.
		/** @param {string} contact_info the contact information for the application */
		set_contact_info(contact_info: string): void

		/// Sets the enabled providers for fetching the weather.
		/// Note that it is up to the application developer to make sure that the terms of use for each service are respected.
		///
		/// Online providers will not be enabled if the application ID is not set to a valid value.
		/** @param {GWeather.Provider} providers a bitmask of GWeather.Provider */
		set_enabled_providers(providers: Provider): void

		/// Changes the location of the weather report.
		///
		/// Note that this will clear any forecast or current conditions, and you must call [method@GWeather.Info.update] to obtain the new data.
		/** @param {GWeather.Location} location a location for which weather is desired */
		set_location(location: Location): void

		/// Requests a reload of weather conditions and forecast data from enabled network services.
		/// This call does no synchronous IO: rather, the result is delivered by emitting the GWeather.Info.updated signal.
		/// Note that if no network services are enabled, the signal will not be emitted. See GWeather.Info.enabled-providers for details.
		update(): void
	}
	/// A GWeatherLocation represents a "location" of some type known to libgweather; anything from a single weather station to the entire world.
	///
	/// See [enum@GWeather.LocationLevel] for information about how the hierarchy of locations works.
	class Location extends GObject.Object {
		// TODO
	}
	/// The current or forecasted significant phenomenon.
	enum ConditionPhenomenon {
		DRIZZLE,
		DUST,
		DUST_WHIRLS,
		DUSTSTORM,
		FOG,
		FUNNEL_CLOUD,
		HAIL,
		HAZE,
		ICE_CRYSTALS,
		ICE_PELLETS,
		INVALID,
		LAST,
		MIST,
		NONE,
		RAIN,
		SAND,
		SANDSTORM,
		SMALL_HAIL,
		SMOKE,
		SNOW,
		SNOW_GRAINS,
		SPRAY,
		SQUALL,
		TORNADO,
		UNKNOWN_PRECIPITATION,
		VOLCANIC_ASH,
	}
	/// An additional modifier applied to a GWeather.ConditionPhenomenon to describe the current or forecasted weather conditions.
	///
	/// The exact meaning of each qualifier is described at http://www.weather.com/glossary/ and http://www.crh.noaa.gov/arx/wx.tbl.php
	enum ConditionQualifier {
		BLOWING,
		DRIFTING,
		FREEZING,
		HEAVY,
		INVALID,
		LAST,
		LIGHT,
		MODERATE,
		NONE,
		PARTIAL,
		PATCHES,
		SHALLOW,
		SHOWERS,
		THUNDERSTORM,
		VICINITY,
	}
	enum DistanceUnit {
		DEFAULT,
		INVALID,
		KM,
		METERS,
		MILES,
	}
	/// The size/scope of a particular [class@GWeather.Location].
	///
	/// Locations form a hierarchy, with a GWEATHER_LOCATION_WORLD location at the top, divided into regions or countries, and so on.
	///
	/// Countries may or may not be divided into "adm1"s, and "adm1"s may or may not be divided into "adm2"s.
	/// A city will have at least one, and possibly several, weather stations inside it.
	/// Weather stations will never appear outside of cities.
	///
	/// Building a database with [func@GWeather.Location.get_world] will never create detached instances, but deserializing might.
	enum LocationLevel {
		ADM1,
		CITY,
		COUNTRY,
		DETACHED,
		NAMED_TIMEZONE,
		REGION,
		WEATHER_STATION,
		WORLD,
	}
	namespace LocationLevel {
		/// Returns the location level as a string, useful for debugging purposes.
		/** @param {GWeather.LocationLevel} level a GWeather.LocationLevel */
		/** @returns {string} a string */
		export function to_string(level: LocationLevel): string
	}
	/// The measure unit to use for atmospheric pressure values, when retrieved by GWeather.Info.get_value_pressure.
	enum PressureUnit {
		ATM,
		DEFAULT,
		HPA,
		INCH_HG,
		INVALID,
		KPA,
		MB,
		MM_HG,
	}
	enum Provider {
		ALL,
		IWIN,
		MET_NO,
		METAR,
		NONE,
		NWS,
		OWM,
	}
	/// The sky and cloud visibility.
	/// In general it is discouraged to use this value directly to compute the forecast icon: applications should instead use GWeather.Info.get_icon_name or GWeather.Info.get_symbolic_icon_name.
	enum Sky {
		BROKEN,
		CLEAR,
		FEW,
		INVALID,
		LAST,
		OVERCAST,
		SCATTERED,
	}
	namespace Sky {
		export function to_string(sky: Sky): string
		export function to_string_full(sky: Sky, options: {[key: string]: any}): string
	}

	/// The measure unit to use for wind speed values, when retrieved by GWeather.Info.get_value_wind.
	enum SpeedUnit {
		BFT,
		DEFAULT,
		INVALID,
		KNOTS,
		KPH,
		MPH,
		MS,
	}
	namespace SpeedUnit {
		/** @param {GWeather.SpeedUnit} unit a speed unit, or GWeather.SpeedUnit.DEFAULT */
		export function to_string(unit: SpeedUnit): string
	}

	/// The measure unit to use for temperature values, when retrieved by the GWeather.Info.get_value_temp family of functions.
	enum TemperatureUnit {
		CENTIGRADE,
		DEFAULT,
		FAHRENHEIT,
		INVALID,
		KELVIN,
	}
	namespace TemperatureUnit {
        /** @param {GWeather.TemperatureUnit} unit a tempeature unit, or GWeather.TemperatureUnit.DEFAULT */
		export function to_real(unit: TemperatureUnit): TemperatureUnit
	}

	/// The direction of the prevailing wind.
	/// Composite values such as north-north-east indicate a direction between the two component value (north and north-east).
	enum WindDirection {
		E,
		ENE,
		ESE,
		INVALID,
		LAST,
		N,
		NE,
		NNE,
		NNW,
		NW,
		S,
		SE,
		SSE,
		SSW,
		SW,
		VARIABLE,
		W,
		WNW,
		WSW,
	}
	namespace WindDirection {
		export function to_string(wind: WindDirection): string
		export function to_string_full(wind: WindDirection, options: {[key: string]: any}): string
	}
}

declare module "resource:///org/gnome/shell/ui/pageIndicators.js" {
	import St from "gi://St"
	import Clutter from "gi://Clutter"
	export class PageIndicators extends St.BoxLayout {
		constructor(orientation: Clutter.Orientation)
		connect(id: string, callback: (...args: any[]) => any): number;
		connect_after(id: string, callback: (...args: any[]) => any): number;
		connect(sigName: 'page-activated', callback: ($obj: PageIndicators, page: number) => void): number
		connect_after(sigName: 'page-activated', callback: ($obj: PageIndicators, page: number) => void): number
		setReactive(reactive: boolean): void
		setNPages(nPages: number): void
		setCurrentPosition(currentPosition: number): void
		readonly nPages: number
	}
}

declare module "resource:///org/gnome/shell/misc/weather.js" {
	import Signals from "resource:///org/gnome/shell/misc/signals.js"
	import GWeather from "gi://GWeather"
	export class WeatherClient extends Signals.EventEmitter {
		readonly available: boolean
		readonly loading: boolean
		readonly hasLocation: boolean
		readonly info: GWeather.Info
		activateApp(): void
		update(): void
	}
}
