import Clutter from "gi://Clutter"
import St from "gi://St"
import GLib from "gi://GLib"
import Gio from "gi://Gio"
import * as Main from "resource:///org/gnome/shell/ui/main.js"
import { type Extension } from "resource:///org/gnome/shell/extensions/extension.js"
import { type MessageTray } from "resource:///org/gnome/shell/ui/messageTray.js"
import { type DateMenuButton } from "resource:///org/gnome/shell/ui/dateMenu.js"
import {
	type NotificationSection,
	type CalendarMessageList
} from "resource:///org/gnome/shell/ui/calendar.js";
import { type MediaSection } from "resource:///org/gnome/shell/ui/mpris.js"
import { logger } from "./libs/shared/logger.js"
import {
	type SystemItem,
	type Indicator as SystemIndicator
} from "resource:///org/gnome/shell/ui/status/system.js"
import { type PopupMenu } from "resource:///org/gnome/shell/ui/popupMenu.js"
import { type QuickSlider, type QuickSettingsMenu } from "resource:///org/gnome/shell/ui/quickSettings.js"

type StreamSlider = {
	VolumeInput: any,
	InputStreamSlider: QuickSlider,
	OutputStreamSlider: QuickSlider,
}
export const Global = new (class Global {
	QuickSettings: Clutter.Actor
	QuickSettingsMenu: QuickSettingsMenu
	QuickSettingsGrid: St.Widget
	QuickSettingsBox: St.BoxLayout
	QuickSettingsActor: St.Widget
	get QuickSettingsSystemIndicator(): Promise<SystemIndicator> {
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
	get QuickSettingsSystemItem(): Promise<SystemItem> {
		return this.QuickSettingsSystemIndicator
			.then(system=>(system as any)._systemItem)
			.catch(logger.error)
	}

	DateMenu: DateMenuButton
	DateMenuMenu: PopupMenu
	DateMenuBox: Clutter.Actor
	DateMenuHolder: Clutter.Actor

	MessageTray: MessageTray

	Extension: Extension
	Settings: Gio.Settings

	get MessageList(): CalendarMessageList {
		return (this.DateMenu as any)._messageList
	}
	get NotificationSection(): NotificationSection {
		return (this.DateMenu as any)._messageList._notificationSection
	}
	get MediaSection(): MediaSection {
		return (this.DateMenu as any)._messageList._mediaSection
	}
	get DateMenuIndicator(): Clutter.Actor {
		return (this.DateMenu as any)._indicator
	}

	GetShutdownMenuBox(): Promise<Clutter.Actor> {
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

	private StreamSliderGetter(): StreamSlider|null {
		if (!(this.QuickSettings as any)._volumeInput)
			return null
		return {
			VolumeInput: (this.QuickSettings as any)._volumeInput,
			InputStreamSlider: (this.QuickSettings as any)._volumeInput._input,
			OutputStreamSlider: (this.QuickSettings as any)._volumeOutput._output,
		}
	}
	GetStreamSlider(): Promise<StreamSlider> {
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

	private DBusFiles: Map<string, Gio.DBusNodeInfo>
	private Decoder: TextDecoder
	GetDbusInterface(path: string, interfaceName: string) {
		let cachedInfo = this.DBusFiles.get(path)
		if (!cachedInfo) {
			const DbusFile = Gio.File.new_for_path(`${this.Extension.path}/${path}`)
			cachedInfo = Gio.DBusNodeInfo.new_for_xml(this.Decoder.decode(DbusFile.load_contents(null)[1]))
			this.DBusFiles.set(path, cachedInfo)
		}
		return cachedInfo.lookup_interface(interfaceName)
	}

	private Shaders: Map<string, [string, string]>
	GetShader(path: string): [string, string] {
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

	unload() {
		this.QuickSettings = null
		this.QuickSettingsMenu = null
		this.QuickSettingsGrid = null
		this.QuickSettingsBox = null
		this.QuickSettingsActor = null
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
	load(extension: Extension) {
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

		// Date Menu
		const DateMenu = this.DateMenu = Main.panel.statusArea.dateMenu
		const DateMenuMenu = this.DateMenuMenu = DateMenu.menu as any
		this.DateMenuBox = DateMenuMenu.box
		this.DateMenuHolder = DateMenuMenu.box.first_child.first_child

		// Message
		this.MessageTray = Main.messageTray
	}
})()
