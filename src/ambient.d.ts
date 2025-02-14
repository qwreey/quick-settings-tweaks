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

declare module "resource:///org/gnome/shell/misc/weather.js" {
	import Signals from "resource:///org/gnome/shell/misc/signals.js"
	export type WeatherInfo = {}
	export class WeatherClient extends Signals.EventEmitter {
		readonly available: boolean
		readonly loading: boolean
		readonly hasLocation: boolean
		readonly info: WeatherInfo
		activateApp(): void
		update(): void
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
