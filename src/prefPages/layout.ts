import Adw from "gi://Adw"
import GObject from "gi://GObject"
import Gio from "gi://Gio"
import GLib from "gi://GLib"
import Gtk from "gi://Gtk"
import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js"
import Config from "../config.js"
import type QstExtensionPreferences from "../prefs.js"
import { ToggleOrderItem } from "../libs/types/toggleOrderItem.js"
import {
	SwitchRow,
	UpDownButton,
	Row,
	Group,
	DialogRow,
	ToggleButtonRow,
	ResetButton,
	setScrollToFocus,
	delayedSetScrollToFocus,
	fixPageScrollIssue,
	Dialog,
	Button,
	removeRowBottomBorder,
	removeRowMinHeight,
	DropdownRow,
} from "../libs/prefs/components.js"
import { SystemIndicatorOrderItem } from "../libs/types/systemIndicatorOrderItem.js"
import { QuickSettingsOrderItem } from "../libs/types/quickSettingsOrderItem.js"

// #region OrderGroup
function OrderGroup<T extends OrderInfo.Base>({
	page, dialog, bind, sensitiveBind, info
}:{
	page: Adw.PreferencesPage,
	dialog: Adw.PreferencesDialog,
	bind: string,
	sensitiveBind: string,
	info: OrderInfo<T>
}): Adw.PreferencesGroup {
	// Create group
	const itemRows = new Map<T, Adw.ActionRow>()
	const header = new Gtk.Box({})
	const group = Group({
		title: info.getGroupTitle(),
		description: info.getGroupDescription(),
		headerSuffix: header
	})

	// Edit functions
	const saveItem = (item: T, edited: T): string|null => {
		const list = info.getListFromSettings()
		const index = list.findIndex(targetItem => info.match(targetItem, item))
		if (index == -1) {
			return _("The item not found")
		}
		if (info.match(item, edited)) {
			return _("No changes")
		}
		if (list.some(listItem => info.match(listItem, edited))) {
			return _("The same item already exists")
		}
		list[index] = edited
		info.setListToSettings(list)
		return null
	}
	const editItem = (item: T)=>{
		Dialog.StackedPage({
			dialog,
			title: _("Properties of %s").format(item.friendlyName),
			childrenRequest: (_page, _dialog)=>{
				const editLayout = info.createEditLayout(item)
				const saveButton = Button({
					marginBottom: 0,
					marginTop: 0,
					iconName: "document-save-symbolic",
					text: _("Save"),
					action: ()=>{
						const edited = editLayout.getValue()
						const saved = saveItem(item, edited)
						if (saved == null) {
							item = edited
						} else {
							dialog.add_toast(new Adw.Toast({
								timeout: 6,
								title: saved
							}))
						}
					}
				})
				return [
					Group({
						title: _("Toggle editor"),
						header_suffix: saveButton,
					}, editLayout.layout)
				]
			}
		})
	}
	const deleteItem = (item: T)=>{
		const list = info.getListFromSettings()
		const index = list.findIndex(targetItem => info.match(targetItem, item))
		if (index == -1) return
		list.splice(index, 1)
		info.setListToSettings(list)
	}
	const hideItem = (item: T, hide: boolean)=>{
		const list = info.getListFromSettings()
		list.find(targetItem => info.match(targetItem, item)).hide = hide
		info.setListToSettings(list)
		dialog.add_toast(new Adw.Toast({
			title: _("This option requires full gnome-shell reloading"),
			timeout: 12,
		}))
	}
	const moveItem = (item: T, offset: number)=>{
		const list = info.getListFromSettings()
		const index = list.findIndex(targetItem => info.match(targetItem, item))
		if (!offset) return
		const sign = Math.sign(offset)
		let targetIndex = index
		for (let count = Math.abs(offset); count > 0;) {
			if (targetIndex <= 0 && sign == -1) break
			if ((targetIndex >= (list.length - 1)) && sign == 1) break
			if (info.moveBlocking(list, item, index, list[targetIndex], targetIndex)) break
			targetIndex += sign
			if (info.skip(list, item, index, list[targetIndex], targetIndex)) count--
		}
		if (index == targetIndex) return
		list.splice(index, 1)
		list.splice(targetIndex, 0, item)
		info.setListToSettings(list)
	}

	// Control items
	const pruneItems = (list: T[])=>{
		for (const [targetItem, row] of itemRows.entries()) {
			if (list.some(item => info.match(item, targetItem))) continue
			itemRows.delete(targetItem)
			group.remove(row)
		}
	}
	const pushItems = (list: T[])=>{
		for (const newItem of list) {
			// Filter already exist
			if ([...itemRows.entries()].find(([item]) => info.match(item, newItem)))
				continue

			// Create row
			const row = Row({
				settings: info.settings,
				title: info.getDisplayName(newItem),
				subtitle: info.getSubtitle(newItem),
				sensitiveBind,
			})
			row.visible = info.shouldShow(newItem)

			// Update icon
			const systemKey = info.getSystemKey(newItem)
			const iconName = systemKey && info.systemIcons.get(systemKey)
			if (iconName) {
				const icon = new Gtk.Image({
					icon_name: iconName,
					pixel_size: 18,
					margin_start: 8,
					margin_end: 2,
				})
				row.add_prefix(icon)
			}

			// Create Up & Down button
			const updown = UpDownButton({
				settings: info.settings,
				sensitiveBind: "toggles-layout-enabled",
				action: (direction)=>{
					moveItem(newItem, direction == UpDownButton.Direction.Up ? -1 : 1)
				}
			})
			row.add_prefix(updown)

			// Hide button
			if (info.canHide(newItem)) {
				const toggle = new Gtk.ToggleButton({
					margin_bottom: 8,
					margin_top: 8,
					label: _("Hide"),
					active: newItem.hide ?? false,
				})
				toggle.connect("notify::active", () => hideItem(newItem, toggle.get_active()))
				row.add_suffix(toggle)
			}

			// Delete & Edit button
			if (info.canEdit(newItem)) {
				const deleteButton = new Gtk.Button({
					icon_name: "edit-clear-symbolic",
					margin_bottom: 8,
					margin_top: 8,
				})
				const editButton = new Gtk.Button({
					icon_name: "document-edit-symbolic",
					margin_bottom: 8,
					margin_top: 8,
				})
				deleteButton.connect("clicked", deleteItem.bind(null, newItem))
				editButton.connect("clicked", editItem.bind(null, newItem))
				row.add_suffix(deleteButton)
				row.add_suffix(editButton)
			}

			itemRows.set(newItem, row)
			group.add(row)
		}
	}
	const orderItems = (list: T[])=>{
		const rows = [...itemRows.entries()]
		const orderedRows = list
			.map(
				targetItem=>rows.find(
					([item]) => info.match(targetItem, item)
				)?.[1] ?? null
			)
		for (const row of orderedRows) {
			if (!row) continue
			group.remove(row)
			group.add(row)
		}
	}

	// Reset button
	const resetButton = ResetButton({ settings: info.settings, bind, marginBottom: 0, marginTop: 0 })
	resetButton.insert_after(header, null)

	// Add button
	const addButton = info.createAddButton(editItem)
	addButton.insert_after(header, resetButton)

	// Sync to settings
	const update = ()=>{
		setScrollToFocus(page, false)
		const list = info.getListFromSettings()
		pushItems(list)
		pruneItems(list)
		orderItems(list)
		delayedSetScrollToFocus(page, true)
	}
	const settingsConnection = info.settings.connect(`changed::${bind}`, update.bind(null))
	update()
	page.connect("destroy", ()=>info.settings.disconnect(settingsConnection))

	return group
}
abstract class OrderInfo<T extends OrderInfo.Base> {
	settings: Gio.Settings
	constructor(settings: Gio.Settings) {
		this.settings = settings
	}
	abstract getSystemNames(): Map<string, string>
	abstract getSystemIcons(): Map<string, string>
	abstract getSystemKey(item: T): string
	abstract getListFromSettings(): T[]
	abstract setListToSettings(list: T[]): void
	private _systemNames: Map<string, string>
	private _systemIcons: Map<string, string>
	get systemNames(): Map<string, string> {
		return this._systemNames ??= this.getSystemNames()
	}
	get systemIcons(): Map<string, string> {
		return this._systemIcons ??= this.getSystemIcons()
	}
	abstract getDisplayName(item: T): string
	abstract getSubtitle(item: T): string
	abstract canHide(item: T): boolean
	abstract canEdit(item: T): boolean
	abstract createEditLayout(item: T): OrderInfo.EditLayout<T>
	getNextName(list: T[]): string {
		let nth = 1
		let name: string
		while (true) {
			name = _("My item #%d").format(nth)
			if (list.findIndex(item => item.friendlyName == name) == -1) break
			nth += 1
		}
		return name
	}
	abstract create(friendlyName: string): T
	abstract match(a: T, b: T): boolean
	abstract shouldShow(item: T): boolean
	skip(_list: T[], _moving: T, _movingIndex: number, target: T, _targetIndex: number): boolean {
		return this.shouldShow(target)
	}
	moveBlocking(_list: T[], _moving: T, _movingIndex: number, target: T, _targetIndex: number): boolean {
		return false
	}
	createAddButton(editItem: (item: T)=>void): Gtk.Widget {
		return Button({
			marginBottom: 0,
			marginTop: 0,
			iconName: "list-add",
			text: _("New Item"),
			action: ()=>{
				const list = this.getListFromSettings()
				const item = this.create(this.getNextName(list))
				list.push(item)
				this.setListToSettings(list)
				editItem(item)
			}
		})
	}
	getGroupTitle(): string {
		return _("Ordering and Hiding")
	}
	getGroupDescription(): string|null {
		return null
	}
}
namespace OrderInfo {
	export type EditLayout<T> = {
		layout: any[],
		getValue: ()=>T,
	}
	export type Base = {
		hide?: boolean,
		friendlyName?: string,
	}
}
// #endregion OrderGroup

class ToggleOrderInfo extends OrderInfo<ToggleOrderItem> {
	createEditLayout(item: ToggleOrderItem): OrderInfo.EditLayout<ToggleOrderItem> {
		const friendlyName = new Adw.EntryRow({
			text: item.friendlyName ?? "",
			max_length: 2048,
			title: _("Friendly Name"),
		})
		removeRowBottomBorder(friendlyName)
		const hideRow = new Adw.SwitchRow({
			active: item.hide ?? false,
			title: _("Hide"),
		})
		const titleRegex = new Adw.EntryRow({
			text: item.titleRegex ?? "",
			max_length: 2048,
			title: _("Title Regex (Javascript Regex)")
		})
		const constructorName = new Adw.EntryRow({
			text: item.constructorName ?? "",
			max_length: 2028,
			title: _("Constructor Name")
		})
		removeRowBottomBorder(constructorName)
		const gtypeName = new Adw.EntryRow({
			text: item.gtypeName ?? "",
			max_length: 2028,
			title: _("GType Name")
		})
		removeRowBottomBorder(gtypeName)
		return {
			layout: [
				hideRow,
				friendlyName,
				Row({
					subtitle: _("This is the comment for easy identification in the settings list. It has no effect on the behavior of the extension"),
					onCreated: removeRowMinHeight,
				}),
				constructorName,
				Row({
					subtitle: _("Javascript constructor name"),
					onCreated: removeRowMinHeight,
				}),
				gtypeName,
				Row({
					subtitle: _("GObject gtype name. You can get this value by calling GObject.type_name_from_instance"),
					onCreated: removeRowMinHeight,
				}),
				titleRegex,
			],
			getValue: ()=>({
				...item,
				friendlyName: friendlyName.text,
				constructorName: constructorName.text,
				gtypeName: gtypeName.text,
				titleRegex: titleRegex.text,
				hide: hideRow.active,
			})
		}
	}
	getSystemKey(item: ToggleOrderItem): string {
		return item.constructorName
	}
	getSystemNames(): Map<string, string> {
		const IGNORE_XGETTEXT=_
		return new Map<string, string>([
			[ "NMWiredToggle", IGNORE_XGETTEXT("Wired Connections") ],
			[ "NMWirelessToggle", IGNORE_XGETTEXT("Wi-Fi") ],
			[ "NMModemToggle", IGNORE_XGETTEXT("Mobile Connections") ],
			[ "NMBluetoothToggle", IGNORE_XGETTEXT("Bluetooth Tethers") ],
			[ "NMVpnToggle", IGNORE_XGETTEXT("VPN") ],
			[ "BluetoothToggle", IGNORE_XGETTEXT("Bluetooth") ],
			[ "PowerProfilesToggle", IGNORE_XGETTEXT("Power Mode") ],
			[ "NightLightToggle", IGNORE_XGETTEXT("Night Light") ],
			[ "DarkModeToggle", IGNORE_XGETTEXT("Dark Style") ],
			[ "KeyboardBrightnessToggle", _("Keyboard Backlight") ],
			[ "RfkillToggle", IGNORE_XGETTEXT("Airplane Mode") ],
			[ "RotationToggle", IGNORE_XGETTEXT("Auto Rotate") ],
			[ "DndQuickToggle", _("Do Not Disturb") ],
			[ "UnsafeQuickToggle", _("Unsafe Mode") ],
		])
	}
	getSystemIcons(): Map<string, string> {
		return new Map<string, string>([
			[ "NMWiredToggle", "network-wired-symbolic" ],
			[ "NMWirelessToggle", "network-wireless-signal-excellent-symbolic" ],
			[ "NMModemToggle", "network-cellular-symbolic" ],
			[ "NMBluetoothToggle", "network-cellular-symbolic" ],
			[ "NMVpnToggle", "network-vpn-symbolic" ],
			[ "BluetoothToggle", "bluetooth-active-symbolic" ],
			[ "PowerProfilesToggle", "power-profile-balanced-symbolic" ],
			[ "NightLightToggle", "night-light-symbolic" ],
			[ "DarkModeToggle", "weather-clear-night" ],
			[ "KeyboardBrightnessToggle", "preferences-desktop-keyboard" ],
			[ "RfkillToggle", "airplane-mode-symbolic" ],
			[ "RotationToggle", "object-rotate-right" ],
			[ "DndQuickToggle", "notifications-disabled-symbolic" ],
			[ "UnsafeQuickToggle", "channel-secure-symbolic" ],
		])
	}
	getListFromSettings(): ToggleOrderItem[] {
		return this.settings.get_value("toggles-layout-order").recursiveUnpack() as ToggleOrderItem[]
	}
	setListToSettings(list: ToggleOrderItem[]): void {
		const mappedList = list.map(item => {
			const out = {}
			for (const [key, value] of Object.entries(item)) {
				switch (typeof value) {
					case "boolean":
						out[key] = GLib.Variant.new_variant(
							GLib.Variant.new_boolean(value)
						)
						break
					case "string":
						out[key] = GLib.Variant.new_variant(
							GLib.Variant.new_string(value)
						)
				}
			}
			return out
		})
		this.settings.set_value("toggles-layout-order", new GLib.Variant("aa{sv}", mappedList))
	}
	getDisplayName(item: ToggleOrderItem): string {
		if (item.nonOrdered) return _("Unordered items")
		if (item.isSystem) return this.systemNames.get(item.constructorName) ?? "Unknown"
		return item.friendlyName || item.constructorName || item.gtypeName || item.titleRegex || "Unknown"
	}
	getSubtitle(item: ToggleOrderItem): string {
		if (item.nonOrdered) return ""
		if (item.isSystem) return item.constructorName ?? ""
		if (item.friendlyName) return item.constructorName || item.gtypeName || item.titleRegex || "Unknown"
		return ""
	}
	canHide(item: ToggleOrderItem): boolean {
		if (!item.isSystem) return true
		return (
			item.constructorName != "DndQuickToggle"
			&& item.constructorName != "UnsafeQuickToggle"
		)
	}
	canEdit(item: ToggleOrderItem): boolean {
		return !item.isSystem && !item.nonOrdered
	}
	match(a: ToggleOrderItem, b: ToggleOrderItem): boolean {
		return ToggleOrderItem.match(a, b)
	}
	create(friendlyName: string): ToggleOrderItem {
		return ToggleOrderItem.create(friendlyName)
	}
	shouldShow(item: ToggleOrderItem): boolean {
		if (item.constructorName == "DndQuickToggle") {
			return this.settings.get_boolean("dnd-quick-toggle-enabled")
		} else if (item.constructorName == "UnsafeQuickToggle") {
			return this.settings.get_boolean("unsafe-quick-toggle-enabled")
		}
		return true
	}
}

class SystemIndicatorOrderInfo extends OrderInfo<SystemIndicatorOrderItem> {
	createEditLayout(item: SystemIndicatorOrderItem): OrderInfo.EditLayout<SystemIndicatorOrderItem> {
		const friendlyName = new Adw.EntryRow({
			text: item.friendlyName ?? "",
			max_length: 2048,
			title: _("Friendly Name"),
		})
		removeRowBottomBorder(friendlyName)
		const hideRow = new Adw.SwitchRow({
			active: item.hide ?? false,
			title: _("Hide"),
		})
		const constructorName = new Adw.EntryRow({
			text: item.constructorName ?? "",
			max_length: 2028,
			title: _("Constructor Name")
		})
		removeRowBottomBorder(constructorName)
		const gtypeName = new Adw.EntryRow({
			text: item.gtypeName ?? "",
			max_length: 2028,
			title: _("GType Name")
		})
		removeRowBottomBorder(gtypeName)
		return {
			layout: [
				hideRow,
				friendlyName,
				Row({
					subtitle: _("This is the comment for easy identification in the settings list. It has no effect on the behavior of the extension"),
					onCreated: removeRowMinHeight,
				}),
				constructorName,
				Row({
					subtitle: _("Javascript constructor name"),
					onCreated: removeRowMinHeight,
				}),
				gtypeName,
				Row({
					subtitle: _("GObject gtype name. You can get this value by calling GObject.type_name_from_instance"),
					onCreated: removeRowMinHeight,
				}),
			],
			getValue: ()=>({
				...item,
				friendlyName: friendlyName.text,
				constructorName: constructorName.text,
				gtypeName: gtypeName.text,
				hide: hideRow.active,
			})
		}
	}
	getSystemKey(item: SystemIndicatorOrderItem): string {
		return item.gtypeName
	}
	getSystemNames(): Map<string, string> {
		const IGNORE_XGETTEXT=_
		return new Map<string, string>([
			[ "Gjs_toggle_dndQuickToggle_DndIndicator", _("Do Not Disturb") ],
			[ "Gjs_status_remoteAccess_RemoteAccessApplet", _("Remote Access Applet") ],
			[ "Gjs_status_camera_Indicator", _("Camera") ],
			[ "Gjs_status_volume_InputIndicator", _("Volume Input") ],
			[ "Gjs_status_location_Indicator", _("Location") ],
			[ "Gjs_status_thunderbolt_Indicator", _("Thunderbolt") ],
			[ "Gjs_status_nightLight_Indicator", IGNORE_XGETTEXT("Night Light") ],
			[ "Gjs_status_network_Indicator", _("Network") ],
			[ "Gjs_status_bluetooth_Indicator", IGNORE_XGETTEXT("Bluetooth") ],
			[ "Gjs_status_rfkill_Indicator", IGNORE_XGETTEXT("Airplane Mode") ],
			[ "Gjs_status_volume_OutputIndicator", _("Volume Output") ],
			[ "Gjs_ui_panel_UnsafeModeIndicator", _("Unsafe Mode") ],
			[ "Gjs_status_system_Indicator", _("System (Battery)") ],
		])
	}
	getSystemIcons(): Map<string, string> {
		return new Map<string, string>([
			[ "Gjs_toggle_dndQuickToggle_DndIndicator", "notifications-disabled-symbolic" ],
			[ "Gjs_status_remoteAccess_RemoteAccessApplet", "preferences-desktop-remote-desktop" ],
			[ "Gjs_status_camera_Indicator", "camera-photo-symbolic" ],
			[ "Gjs_status_volume_InputIndicator", "microphone-sensitivity-high-symbolic" ],
			[ "Gjs_status_location_Indicator", "find-location-symbolic" ],
			[ "Gjs_status_thunderbolt_Indicator", "system-run-symbolic" ],
			[ "Gjs_status_nightLight_Indicator", "night-light-symbolic" ],
			[ "Gjs_status_network_Indicator", "network-wireless-signal-excellent-symbolic" ],
			[ "Gjs_status_bluetooth_Indicator", "bluetooth-active-symbolic" ],
			[ "Gjs_status_rfkill_Indicator", "airplane-mode-symbolic" ],
			[ "Gjs_status_volume_OutputIndicator", "audio-volume-medium-symbolic" ],
			[ "Gjs_ui_panel_UnsafeModeIndicator", "channel-secure-symbolic" ],
			[ "Gjs_status_system_Indicator", "system-shutdown-symbolic" ],
		])
	}
	getListFromSettings(): SystemIndicatorOrderItem[] {
		return this.settings.get_value("system-indicator-layout-order").recursiveUnpack() as SystemIndicatorOrderItem[]
	}
	setListToSettings(list: SystemIndicatorOrderItem[]): void {
		const mappedList = list.map(item => {
			const out = {}
			for (const [key, value] of Object.entries(item)) {
				switch (typeof value) {
					case "boolean":
						out[key] = GLib.Variant.new_variant(
							GLib.Variant.new_boolean(value)
						)
						break
					case "string":
						out[key] = GLib.Variant.new_variant(
							GLib.Variant.new_string(value)
						)
				}
			}
			return out
		})
		this.settings.set_value("system-indicator-layout-order", new GLib.Variant("aa{sv}", mappedList))
	}
	getDisplayName(item: SystemIndicatorOrderItem): string {
		if (item.nonOrdered) return _("Unordered items")
		if (item.isSystem) return this.systemNames.get(item.gtypeName) ?? "Unknown"
		return item.friendlyName || item.constructorName || item.gtypeName || "Unknown"
	}
	getSubtitle(item: SystemIndicatorOrderItem): string {
		if (item.nonOrdered) return ""
		if (item.isSystem) return item.gtypeName ?? ""
		if (item.friendlyName) return item.constructorName || item.gtypeName || "Unknown"
		return ""
	}
	canHide(item: SystemIndicatorOrderItem): boolean {
		if (!item.isSystem) return true
		return item.gtypeName != "Gjs_toggle_dndQuickToggle_DndIndicator"
	}
	canEdit(item: SystemIndicatorOrderItem): boolean {
		return !item.isSystem && !item.nonOrdered
	}
	match(a: SystemIndicatorOrderItem, b: SystemIndicatorOrderItem): boolean {
		return SystemIndicatorOrderItem.match(a, b)
	}
	create(friendlyName: string): SystemIndicatorOrderItem {
		return SystemIndicatorOrderItem.create(friendlyName)
	}
	shouldShow(item: SystemIndicatorOrderItem): boolean {
		if (item.gtypeName == "Gjs_toggle_dndQuickToggle_DndIndicator") {
			return (
				this.settings.get_boolean("dnd-quick-toggle-enabled")
				&& this.settings.get_string("dnd-quick-toggle-indicator-position") == "system-tray"
			)
		}
		return true
	}
}

// class QuickSettingsOrderInfo extends OrderInfo<QuickSettingsOrderItem> {
	
// }

// #region SystemItemOrderGroup
function SystemItemOrderGroup(settings: Gio.Settings, page: Adw.PreferencesPage): Adw.PreferencesGroup {
	let items = new Map<string, Adw.ActionRow>()
	let group: Adw.PreferencesGroup
	const reorder = ()=>{
		setScrollToFocus(page, false)
		const order = SystemItemOrderGroup.copyOrder(settings.get_strv("system-items-layout-order"))
		for (const name of order) {
			const target = items.get(name)
			group.remove(target)
			group.add(target)
		}
		delayedSetScrollToFocus(page, true)
	}
	const move = (direction: UpDownButton.Direction, name: string)=>{
		const order = SystemItemOrderGroup.copyOrder(settings.get_strv("system-items-layout-order"))
		const index = order.indexOf(name)
		if (direction == UpDownButton.Direction.Up) {
			if (index == 0) return
			order[index] = order[index - 1]
			order[index - 1] = name
		} else {
			if (index == (SystemItemOrderGroup.DefaultOrder.length - 1)) return
			order[index] = order[index + 1]
			order[index + 1] = name
		}
		settings.set_strv("system-items-layout-order", order)
	}

	const orderConnection = settings.connect("changed::system-items-layout-order", reorder)
	page.connect("destroy", ()=>settings.disconnect(orderConnection))

	return Group({
		title: _("Ordering and Hiding"),
		headerSuffix: ResetButton({ settings, bind: "system-items-layout-order", marginBottom: 0, marginTop: 0 }),
		onCreated(row: Adw.PreferencesGroup) {
			group = row
			reorder()
		},
	}, [
		Row({
			title: _("Desktop Spacer"),
			prefix: UpDownButton({
				settings,
				sensitiveBind: "system-items-layout-enabled",
				action: (direction) => move(direction, "desktopSpacer"),
			}),
			onCreated(row) {
				items.set("desktopSpacer", row)
			},
		}),
		Row({
			title: _("Laptop Spacer"),
			prefix: UpDownButton({
				settings,
				sensitiveBind: "system-items-layout-enabled",
				action: (direction) => move(direction, "laptopSpacer"),
			}),
			onCreated(row) {
				items.set("laptopSpacer", row)
			},
		}),
		...[
			{
				title: _("Capture button"),
				bind: "system-items-layout-hide-screenshot",
				icon: "camera-photo",
				targetName: "screenshot",
			},
			{
				title: _("Settings button"),
				bind: "system-items-layout-hide-settings",
				icon: "preferences-system-symbolic",
				targetName: "settings",
			},
			{
				title: _("Lock button"),
				bind: "system-items-layout-hide-lock",
				icon: "system-lock-screen-symbolic",
				targetName: "lock",
			},
			{
				title: _("Shutdown button"),
				bind: "system-items-layout-hide-shutdown",
				icon: "system-shutdown-symbolic",
				targetName: "shutdown",
			},
			{
				title: _("Battery button"),
				bind: "system-items-layout-hide-battery",
				icon: "battery-symbolic",
				targetName: "battery",
			},
		].map(item => ToggleButtonRow({
			settings,
			text: _("Hide"),
			sensitiveBind: "system-items-layout-enabled",
			...item,
			onCreated(row: Adw.ActionRow) {
				items.set(item.targetName, row)
				row.add_prefix(new Gtk.Image({
					icon_name: item.icon,
					pixel_size: 16,
					margin_start: 8
				}))
				row.add_prefix(UpDownButton({
					settings,
					sensitiveBind: "system-items-layout-enabled",
					action: (direction) => move(direction, item.targetName),
				}))
			},
		}))
	])
}
namespace SystemItemOrderGroup {
	export const DefaultOrder = ["battery", "laptopSpacer", "screenshot", "settings", "desktopSpacer", "lock", "shutdown"]
	export function copyOrder(order: string[]): string[] {
		return DefaultOrder
		.map(item => ({
			item,
			index: order.indexOf(item),
		}))
		.sort((a, b)=>a.index-b.index)
		.map(item => item.item)
	}
}
// #endregion SystemItemOrderGroup

export const LayoutPage = GObject.registerClass({
	GTypeName: Config.baseGTypeName+"LayoutPage",
}, class LayoutPage extends Adw.PreferencesPage {
	constructor(settings: Gio.Settings, _prefs: QstExtensionPreferences, window: Adw.PreferencesWindow) {
		super({
			name: "Layout",
			title: _("Layout"),
			iconName: "view-sort-descending-symbolic",
		})
		fixPageScrollIssue(this)

		// Quick toggles
		Group({
			parent: this,
			title: _("Quick Toggles Layout"),
			description: _("Adjust quick toggles layout"),
		},[
			SwitchRow({
				bind: "toggles-layout-enabled",
				settings,
				onDetailed: ()=>{
					Dialog({
						window,
						childrenRequest: (page, dialog) => [OrderGroup({
							page,
							dialog,
							bind: "toggles-layout-order",
							sensitiveBind: "toggles-layout-enabled",
							info: new ToggleOrderInfo(settings),
						})],
						title: _("Adjust quick toggles layout"),
					})
				},
				title: _("Ordering and Hiding"),
				subtitle: _("Reorder and hide quick toggles"),
				experimental: true,
			}),
		])

		// System indicators
		Group({
			parent: this,
			title: _("System Indicators"),
			description: _("Adjust system indicators layout and style"),
		},[
			SwitchRow({
				settings,
				bind: "system-indicator-screen-sharing-indicator-use-accent",
				title: _("Accent screen sharing indicator"),
				subtitle: _("Use shell accent color on screen sharing indicator"),
			}),
			SwitchRow({
				settings,
				bind: "system-indicator-screen-recording-indicator-use-accent",
				title: _("Accent screen recording indicator"),
				subtitle: _("Use shell accent color on screen recording indicator"),
			}),
			DropdownRow({
				settings,
				bind: "system-indicator-privacy-indicator-style",
				title: _("Privacy indicators style"),
				subtitle: _("Use monochrome or shell accent color on privarcy indicators"),
				items: [
					{ name: _("Default"), value: "default" },
					{ name: _("Accent"), value: "accent" },
					{ name: _("Monochrome"), value: "monochrome" },
				],
			}),
			SwitchRow({
				settings,
				bind: "system-indicator-layout-enabled",
				onDetailed: ()=>{
					Dialog({
						window,
						title: _("Adjust system indicators"),
						childrenRequest: (page, dialog) => [OrderGroup({
							page,
							dialog,
							bind: "system-indicator-layout-order",
							sensitiveBind: "system-indicator-layout-enabled",
							info: new SystemIndicatorOrderInfo(settings),
						})],
					})
				},
				title: _("Ordering and Hiding"),
				subtitle: _("Reorder and hide system indicators"),
				experimental: true,
			}),
		])

		// System Items
		Group({
			parent: this,
			title: _("System Items Layout"),
			headerSuffix: SwitchRow({
				settings,
				bind: "system-items-layout-enabled",
			}),
			description: _("Adjust system items layout"),
		},[
			SwitchRow({
				settings,
				title: _("Hide layout box"),
				subtitle: _("Hide all buttons and layout box"),
				bind: "system-items-layout-hide",
				sensitiveBind: "system-items-layout-enabled",
			}),
			DialogRow({
				settings,
				window,
				sensitiveBind: "system-items-layout-enabled",
				title: _("Ordering and Hiding"),
				subtitle: _("Reorder and hide system items"),
				dialogTitle: _("Adjust system items layout"),
				experimental: true,
				childrenRequest: page => [SystemItemOrderGroup(settings, page)],
			}),
		])

		// DateMenu
		Group({
			parent: this,
			title: _("Date Menu"),
			description: _("Adjust Date Menu layout"),
		},[
			SwitchRow({
				settings,
				title: _("Hide Notifications"),
				subtitle: _("Hide notifications on the date menu"),
				bind: "datemenu-hide-notifications",
			}),
			SwitchRow({
				settings,
				title: _("Hide Media Control"),
				subtitle: _("Hide media control on the date menu"),
				bind: "datemenu-hide-media-control",
			}),
			SwitchRow({
				settings,
				title: _("Hide left box"),
				subtitle: _("Hide the left box of the date menu, which contains notifications and media control"),
				bind: "datemenu-hide-left-box",
			}),
			SwitchRow({
				settings,
				title: _("Hide right box"),
				subtitle: _("Hide the right box of the date menu, which contains calendar, world clock and weather"),
				bind: "datemenu-hide-right-box",
			}),
			SwitchRow({
				settings,
				title: _("Disable menu"),
				subtitle: _("Do not open date menu when the date menu button clicked"),
				bind: "datemenu-disable-menu",
			}),
		])
	}
})
