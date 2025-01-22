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
	setScrollToFocus,
	delayedSetScrollToFocus,
	fixPageScrollIssue,
} from "../libs/prefComponents.js"

function ToggleEditorGroup(settings: Gio.Settings, page: Adw.PreferencesPage): Adw.PreferencesGroup {
	const systemToggleNames = ToggleEditorGroup.getSystemToggleNames()
	const itemRows = new Map<QuickToggleOrderItem, Adw.ActionRow>()

	const group = Group({
	})

	const setHide = (item: QuickToggleOrderItem, hide: boolean)=>{
		const list = ToggleEditorGroup.getOrderListFromSettings(settings)
		list.find(targetItem => QuickToggleOrderItem.match(targetItem, item)).hide = hide
		ToggleEditorGroup.setOrderListToSettings(settings, list)
	}
	const move = (item: QuickToggleOrderItem, direction: UpDownButton.Direction)=>{
		const list = ToggleEditorGroup.getOrderListFromSettings(settings)
		const index = list.findIndex(targetItem => QuickToggleOrderItem.match(targetItem, item))
		const targetIndex = index + (direction == UpDownButton.Direction.Up ? -1 : 1)
		if (targetIndex < 0 || targetIndex >= list.length) return
		const row = list[index]
		list[index] = list[targetIndex]
		list[targetIndex] = row
		ToggleEditorGroup.setOrderListToSettings(settings, list)
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
				title: ToggleEditorGroup.getDisplayName(newItem, systemToggleNames),
				subtitle: ToggleEditorGroup.getSubtitle(newItem),
				sensitiveBind: "toggle-order-enabled"
			})

			const updown = UpDownButton({
				settings,
				sensitiveBind: "toggle-order-enabled",
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
		const list = ToggleEditorGroup.getOrderListFromSettings(settings)
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
namespace ToggleEditorGroup {
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
			[ "KeyboardBrightnessToggle", IGNORE_XGETTEXT("Keyboard") ],
			[ "RfkillToggle", IGNORE_XGETTEXT("Airplane Mode") ],
			[ "RotationToggle", IGNORE_XGETTEXT("Auto Rotate") ],
			[ "DndQuickToggle", _("Do Not Disturb") ],
			[ "UnsafeQuickToggle", _("Unsafe Mode") ],
		])
	}
	export function getOrderListFromSettings(settings: Gio.Settings): QuickToggleOrderItem[] {
		return settings.get_value("toggle-order").recursiveUnpack() as QuickToggleOrderItem[]
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
		settings.set_value("toggle-order", new GLib.Variant("aa{sv}", mappedList))
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

export const TogglesPage = GObject.registerClass({
	GTypeName: Config.baseGTypeName+'TogglesPage',
}, class TogglesPage extends Adw.PreferencesPage {
	constructor(settings: Gio.Settings, _prefs: QstExtensionPreferences, _window: Adw.PreferencesWindow) {
		super({
			name: 'Toggles',
			title: _('Toggles'),
			iconName: 'view-grid-symbolic',
		})
		fixPageScrollIssue(this)

		// Add
		Group({
			parent: this,
			title: _('Add more buttons'),
			description: _('Turn on the buttons you want to add on Quick Settings'),
		}, [
			SwitchRow({
				settings,
				title: _("DND Quick Toggle"),
				subtitle: _("Turn on to make the DND quick toggle visible on the Quick Settings panel"),
				bind: "add-dnd-quick-toggle-enabled",
			}),
			SwitchRow({
				settings,
				title: _("Unsafe Mode Quick Toggle"),
				subtitle: _("Turn on to make the unsafe quick toggle visible on the Quick Settings panel"),
				bind: "add-unsafe-quick-toggle-enabled",
			}),
		])

		// Order
		Group({
			parent: this,
			title: _("Ordering and Hiding"),
			description: _("Reorder and hide quick toggles"),
			headerSuffix: SwitchRow({
				settings,
				bind: "toggle-order-enabled",
			}),
		},[
			ToggleEditorGroup( settings, this )
		])
	}
})
