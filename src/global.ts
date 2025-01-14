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

export const Global = new (class Global {
	QuickSettings: Clutter.Actor
	QuickSettingsMenu: St.Widget
	QuickSettingsGrid: St.Widget
	QuickSettingsBox: St.BoxLayout
	QuickSettingsActor: St.Widget

	DateMenu: DateMenuButton
	DateMenuBox: Clutter.Actor
	DateMenuHolder: Clutter.Actor
	DateMenuIndicator: Clutter.Actor

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

	private StreamSliderGetter() {
		if (!(this.QuickSettings as any)._volumeInput)
			return null
		return {
			VolumeInput: (this.QuickSettings as any)._volumeInput,
			InputStreamSlider: (this.QuickSettings as any)._volumeInput._input,
			OutputStreamSlider: (this.QuickSettings as any)._volumeOutput._output,
		}
	}
	GetStreamSlider(): Promise<any> {
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

	unload() {
		this.QuickSettings = null
		this.QuickSettingsMenu = null
		this.QuickSettingsGrid = null
		this.QuickSettingsBox = null
		this.QuickSettingsActor = null
		this.DateMenu = null
		this.DateMenuBox = null
		this.DateMenuHolder = null
		this.MessageTray = null
		this.Extension = null
		this.Settings = null
		this.DBusFiles = null
		this.DateMenuIndicator = null
	}
	load(extension: Extension) {
		this.Extension = extension
		this.Settings = extension.getSettings()
		this.DBusFiles = new Map()
		this.Decoder = new TextDecoder()

		// Quick Settings Items
		const QuickSettings = this.QuickSettings = Main.panel.statusArea.quickSettings
		this.QuickSettingsMenu = QuickSettings.menu
		this.QuickSettingsGrid = QuickSettings.menu._grid
		this.QuickSettingsBox = QuickSettings.menu.box
		this.QuickSettingsActor = QuickSettings.menu.actor

		// Date Menu
		const DateMenu = this.DateMenu = Main.panel.statusArea.dateMenu
		this.DateMenuBox = (DateMenu.menu as any).box
		this.DateMenuHolder = (DateMenu.menu as any).box.first_child.first_child
		this.DateMenuIndicator = (DateMenu as any)._indicator

		// Message
		this.MessageTray = Main.messageTray
	}
})()
