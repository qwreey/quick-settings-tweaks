import Adw from "gi://Adw"
import GObject from "gi://GObject"
import Gio from "gi://Gio"
import GLib from "gi://GLib"
import Gtk from "gi://Gtk"
import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js"
import Config from "../config.js"
import type QstExtensionPreferences from "../prefs.js"
import { QuickToggleOrderItem } from "../libs/quickToggleOrderItem.js"
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
} from "../libs/prefComponents.js"

// #region ToggleOrderGroup
function ToggleOrderGroup(settings: Gio.Settings, page: Adw.PreferencesPage, dialog: Adw.PreferencesDialog): Adw.PreferencesGroup {
	const systemToggleNames = ToggleOrderGroup.getSystemToggleNames()
	const systemToggleIcons = ToggleOrderGroup.getSystemToggleIcons()
	const itemRows = new Map<QuickToggleOrderItem, Adw.ActionRow>()

	const group = Group({
		title: _("Ordering and Hiding"),
		headerSuffix: ResetButton({ settings, bind: "toggles-layout-order", marginBottom: 0, marginTop: 0 }),
	})

	const setHide = (item: QuickToggleOrderItem, hide: boolean)=>{
		const list = ToggleOrderGroup.getOrderListFromSettings(settings)
		list.find(targetItem => QuickToggleOrderItem.match(targetItem, item)).hide = hide
		ToggleOrderGroup.setOrderListToSettings(settings, list)
		dialog.add_toast(new Adw.Toast({
			title: _("This option requires full gnome-shell reloading"),
			timeout: 12,
		}))
	}
	const move = (item: QuickToggleOrderItem, direction: UpDownButton.Direction)=>{
		const list = ToggleOrderGroup.getOrderListFromSettings(settings)
		const index = list.findIndex(targetItem => QuickToggleOrderItem.match(targetItem, item))
		const targetIndex = index + (direction == UpDownButton.Direction.Up ? -1 : 1)
		if (targetIndex < 0 || targetIndex >= list.length) return
		const row = list[index]
		list[index] = list[targetIndex]
		list[targetIndex] = row
		ToggleOrderGroup.setOrderListToSettings(settings, list)
	}
	const removeOrphans = (list: QuickToggleOrderItem[])=>{
		for (const [targetItem, row] of itemRows.entries()) {
			if (list.some(item => QuickToggleOrderItem.match(item, targetItem))) continue
			itemRows.delete(targetItem)
			group.remove(row)
		}
	}
	const pushChildren = (list: QuickToggleOrderItem[])=>{
		for (const newItem of list) {
			if ([...itemRows.entries()].find(([item]) => QuickToggleOrderItem.match(item, newItem)))
				continue
			const row = Row({
				settings,
				title: ToggleOrderGroup.getDisplayName(newItem, systemToggleNames),
				subtitle: ToggleOrderGroup.getSubtitle(newItem),
				sensitiveBind: "toggles-layout-enabled"
			})

			if (newItem.isSystem && systemToggleIcons.has(newItem.constructorName)) {
				const icon = new Gtk.Image({
					icon_name: systemToggleIcons.get(newItem.constructorName),
					pixel_size: 18,
					margin_start: 8,
					margin_end: 2,
				})
				row.add_prefix(icon)
			}

			const updown = UpDownButton({
				settings,
				sensitiveBind: "toggles-layout-enabled",
				action: (direction)=>move(newItem, direction)
			})
			row.add_prefix(updown)

			const toggle = new Gtk.ToggleButton({
				margin_bottom: 8,
				margin_top: 8,
				label: _("Hide"),
				active: newItem.hide ?? false,
			})
			toggle.connect("notify::active", () => setHide(newItem, toggle.get_active()))
			row.add_suffix(toggle)

			itemRows.set(newItem, row)
			group.add(row)
		}
	}
	const orderChildren = (list: QuickToggleOrderItem[])=>{
		const rows = [...itemRows.entries()]
		const orderedRows = list
			.map(
				targetItem=>rows.find(
					([item]) => QuickToggleOrderItem.match(targetItem, item)
				)[1]
			)
		for (const row of orderedRows) {
			group.remove(row)
			group.add(row)
		}
	}

	const update = ()=>{
		setScrollToFocus(page, false)
		const list = ToggleOrderGroup.getOrderListFromSettings(settings)
		pushChildren(list)
		removeOrphans(list)
		orderChildren(list)
		delayedSetScrollToFocus(page, true)
	}
	const settingsConnection = settings.connect("changed::toggle-order", update.bind(null))
	update()
	page.connect("destroy", ()=>settings.disconnect(settingsConnection))

	return group
}
namespace ToggleOrderGroup {
	export function getSystemToggleNames(): Map<string, string> {
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
	export function getSystemToggleIcons(): Map<string, string> {
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
	export function getOrderListFromSettings(settings: Gio.Settings): QuickToggleOrderItem[] {
		return settings.get_value("toggles-layout-order").recursiveUnpack() as QuickToggleOrderItem[]
	}
	export function setOrderListToSettings(settings: Gio.Settings, list: QuickToggleOrderItem[]): void {
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
		settings.set_value("toggles-layout-order", new GLib.Variant("aa{sv}", mappedList))
	}
	export function getDisplayName(
		item: QuickToggleOrderItem,
		systemToggleNames: Map<string, string>
	): string {
		if (item.nonOrdered) return _("Unsorted items")
		if (item.isSystem) return systemToggleNames.get(item.constructorName)
		return item.friendlyName || item.constructorName || item.titleRegex || "Unknown"
	}
	export function getSubtitle(
		item: QuickToggleOrderItem,
	): string {
		if (item.nonOrdered) return ""
		if (item.isSystem) return item.constructorName
		if (item.friendlyName) return item.constructorName || item.titleRegex || "Unknown"
		return ""
	}
}
// #endregion ToggleOrderGroup

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
		settings.set_strv("system-items-order", order)
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
	export const DefaultOrder = ['battery', 'laptopSpacer', 'screenshot', 'settings', 'desktopSpacer', 'lock', 'shutdown']
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
	GTypeName: Config.baseGTypeName+'LayoutPage',
}, class LayoutPage extends Adw.PreferencesPage {
	constructor(settings: Gio.Settings, _prefs: QstExtensionPreferences, window: Adw.PreferencesWindow) {
		super({
			name: 'Layout',
			title: _('Layout'),
			iconName: 'view-sort-descending-symbolic',
		})
		fixPageScrollIssue(this)

		// Quick toggles
		Group({
			parent: this,
			title: _("Quick Toggles Layout"),
			description: _("Adjust quick toggles layout"),
			headerSuffix: SwitchRow({
				settings,
				bind: "toggles-layout-enabled",
			}),
		},[
			DialogRow({
				settings,
				window,
				sensitiveBind: "toggles-layout-enabled",
				title: _("Ordering and Hiding"),
				subtitle: _("Reorder and hide quick toggles"),
				dialogTitle: _("Adjust system items layout"),
				experimental: true,
				childrenRequest: (page, dialog) => [ToggleOrderGroup(settings, page, dialog)],
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
	}
})
