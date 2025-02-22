import Clutter from "gi://Clutter"
import St from "gi://St"
import GLib from "gi://GLib"
import Gio from "gi://Gio"
import * as Main from "resource:///org/gnome/shell/ui/main.js"
import { type Extension } from "resource:///org/gnome/shell/extensions/extension.js"
import { type MessageTray } from "resource:///org/gnome/shell/ui/messageTray.js"
import { type DateMenuButton } from "resource:///org/gnome/shell/ui/dateMenu.js"
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js"
import {
	type NotificationSection,
	type CalendarMessageList
} from "resource:///org/gnome/shell/ui/calendar.js";
import { type MediaSection } from "resource:///org/gnome/shell/ui/mpris.js"
import {
	type SystemItem,
	type Indicator as SystemIndicator
} from "resource:///org/gnome/shell/ui/status/system.js"
import { type PopupMenu } from "resource:///org/gnome/shell/ui/popupMenu.js"
import { type QuickSlider, type QuickSettingsMenu } from "resource:///org/gnome/shell/ui/quickSettings.js"
import Logger from "./libs/shared/logger.js"

type StreamSlider = {
	VolumeInput: any,
	InputStreamSlider: QuickSlider,
	OutputStreamSlider: QuickSlider,
}
export default class Global {
	static QuickSettings: PanelMenu.Button
	static QuickSettingsMenu: QuickSettingsMenu
	static QuickSettingsGrid: St.Widget
	static QuickSettingsBox: St.BoxLayout
	static QuickSettingsActor: St.Widget
	static get QuickSettingsSystemIndicator(): Promise<SystemIndicator> {
		return new Promise(resolve => {
			let system = (this.QuickSettings as any)._system
			if (system) {
				resolve(system)
				return
			}
			GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
				system = (this.QuickSettings as any)._system
				if (!system) return GLib.SOURCE_CONTINUE
				resolve(system)
				return GLib.SOURCE_REMOVE
			})
		})
	}
	static get QuickSettingsSystemItem(): Promise<SystemItem> {
		return this.QuickSettingsSystemIndicator
			.then(system=>(system as any)._systemItem)
			.catch(Logger.error)
	}
	static Indicators: St.BoxLayout

	static DateMenu: DateMenuButton
	static DateMenuMenu: PopupMenu
	static DateMenuBox: Clutter.Actor
	static DateMenuHolder: Clutter.Actor

	static MessageTray: MessageTray

	static Extension: Extension
	static Settings: Gio.Settings

	static get MessageList(): CalendarMessageList {
		return (this.DateMenu as any)._messageList
	}
	static get NotificationSection(): NotificationSection {
		return (this.DateMenu as any)._messageList._notificationSection
	}
	static get MediaSection(): MediaSection {
		return (this.DateMenu as any)._messageList._mediaSection
	}
	static get DateMenuIndicator(): Clutter.Actor {
		return (this.DateMenu as any)._indicator
	}

	static GetShutdownMenuBox(): Promise<Clutter.Actor> {
		// To prevent freeze, priority should be PRIORITY_DEFAULT_IDLE instead of PRIORITY_DEFAULT
		return new Promise(resolve => {
			GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
				if (!(this.QuickSettings as any)._system)
					return GLib.SOURCE_CONTINUE
				resolve((this.QuickSettings as any)._system._systemItem.menu.box)
				return GLib.SOURCE_REMOVE
			})
		})
	}

	private static StreamSliderGetter(): StreamSlider|null {
		if (!(this.QuickSettings as any)._volumeInput)
			return null
		return {
			VolumeInput: (this.QuickSettings as any)._volumeInput,
			InputStreamSlider: (this.QuickSettings as any)._volumeInput._input,
			OutputStreamSlider: (this.QuickSettings as any)._volumeOutput._output,
		}
	}
	static GetStreamSlider(): Promise<StreamSlider> {
		return new Promise(resolve => {
			let streamSlider = this.StreamSliderGetter()
			if (streamSlider) {
				resolve(streamSlider)
				return
			}
			GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
				streamSlider = this.StreamSliderGetter()
				if (!streamSlider) return GLib.SOURCE_CONTINUE
				resolve(streamSlider)
				return GLib.SOURCE_REMOVE
			})
		})
	}

	private static DBusFiles: Map<string, Gio.DBusNodeInfo>
	private static Decoder: TextDecoder
	static GetDbusInterface(path: string, interfaceName: string) {
		let cachedInfo = this.DBusFiles.get(path)
		if (!cachedInfo) {
			const DbusFile = Gio.File.new_for_path(`${this.Extension.path}/${path}`)
			cachedInfo = Gio.DBusNodeInfo.new_for_xml(this.Decoder.decode(DbusFile.load_contents(null)[1]))
			this.DBusFiles.set(path, cachedInfo)
		}
		return cachedInfo.lookup_interface(interfaceName)
	}

	private static Shaders: Map<string, [string, string]>
	static GetShader(path: string): [string, string] {
		let cachedInfo = this.Shaders.get(path)
		if (!cachedInfo) {
			const shaderFile = Gio.File.new_for_path(`${this.Extension.path}/${path}`)
			const [declarations, main] = this.Decoder.decode(shaderFile.load_contents(null)[1]).split(
				/^.*?main\(\s?\)\s?/m
			) as [string, string]
			cachedInfo = [
				declarations.trim(),
				main.trim().replace(/^[{}]/gm, '').trim()
			]
			this.Shaders.set(path, cachedInfo)
		}
		return cachedInfo
	}

	static unload() {
		this.QuickSettings = null
		this.QuickSettingsMenu = null
		this.QuickSettingsGrid = null
		this.QuickSettingsBox = null
		this.QuickSettingsActor = null
		this.Indicators = null
		this.DateMenu = null
		this.DateMenuMenu = null
		this.DateMenuBox = null
		this.DateMenuHolder = null
		this.MessageTray = null
		this.Extension = null
		this.Settings = null
		this.DBusFiles = null
		this.Shaders = null
		this.Decoder = null
	}
	static load(extension: Extension) {
		this.Extension = extension
		this.Settings = extension.getSettings()
		this.Shaders = new Map()
		this.DBusFiles = new Map()
		this.Decoder = new TextDecoder("utf-8")

		// Quick Settings Items
		const QuickSettings = this.QuickSettings = Main.panel.statusArea.quickSettings
		this.QuickSettingsMenu = QuickSettings.menu
		this.QuickSettingsGrid = QuickSettings.menu._grid
		this.QuickSettingsBox = QuickSettings.menu.box
		this.QuickSettingsActor = QuickSettings.menu.actor
		this.Indicators = QuickSettings._indicators

		// Date Menu
		const DateMenu = this.DateMenu = Main.panel.statusArea.dateMenu
		const DateMenuMenu = this.DateMenuMenu = DateMenu.menu as any
		this.DateMenuBox = DateMenuMenu.box
		this.DateMenuHolder = DateMenuMenu.box.first_child.first_child

		// Message
		this.MessageTray = Main.messageTray
	}
}
