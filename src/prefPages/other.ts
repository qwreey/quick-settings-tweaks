import Adw from "gi://Adw"
import GObject from "gi://GObject"
import Gio from "gi://Gio"
import Gtk from "gi://Gtk"
import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js"
import Config from "../config.js"
import type QstExtensionPreferences from "../prefs.js"
import {
	Group,
	Row,
	SwitchRow,
	ResetButton,
	ToggleButtonRow,
	UpDownButton,
	DialogRow,
} from "../libs/prefComponents.js"

function SystemItemOrderGroup(settings: Gio.Settings, page: Adw.PreferencesPage): Adw.PreferencesGroup {
	let items = new Map<string, Adw.ActionRow>()
	let group: Adw.PreferencesGroup
	const reorder = ()=>{
		const order = SystemItemOrderGroup.copyOrder(settings.get_strv("system-items-order"))
		for (const name of order) {
			const target = items.get(name)
			group.remove(target)
			group.add(target)
		}
	}
	const move = (direction: UpDownButton.Direction, name: string)=>{
		const order = SystemItemOrderGroup.copyOrder(settings.get_strv("system-items-order"))
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

	const orderConnection = settings.connect("changed::system-items-order", reorder)
	page.connect("destroy", ()=>settings.disconnect(orderConnection))

	return Group({
		title: _("Ordering and Hiding"),
		headerSuffix: ResetButton({ settings, bind: "system-items-order", marginBottom: 0, marginTop: 0 }),
		onCreated(row: Adw.PreferencesGroup) {
			group = row
			reorder()
		},
	}, [
		Row({
			title: _("Desktop Spacer"),
			prefix: UpDownButton({
				settings,
				sensitiveBind: "system-items-enabled",
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
				sensitiveBind: "system-items-enabled",
				action: (direction) => move(direction, "laptopSpacer"),
			}),
			onCreated(row) {
				items.set("laptopSpacer", row)
			},
		}),
		...[
			{
				title: _("Capture button"),
				bind: "system-items-hide-screenshot",
				icon: "camera-photo",
				targetName: "screenshot",
			},
			{
				title: _("Settings button"),
				bind: "system-items-hide-settings",
				icon: "preferences-system-symbolic",
				targetName: "settings",
			},
			{
				title: _("Lock button"),
				bind: "system-items-hide-lock",
				icon: "system-lock-screen-symbolic",
				targetName: "lock",
			},
			{
				title: _("Shutdown button"),
				bind: "system-items-hide-shutdown",
				icon: "system-shutdown-symbolic",
				targetName: "shutdown",
			},
			{
				title: _("Battery button"),
				bind: "system-items-hide-battery",
				icon: "battery-symbolic",
				targetName: "battery",
			},
		].map(item => ToggleButtonRow({
			settings,
			text: _("Hide"),
			sensitiveBind: "system-items-enabled",
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
					sensitiveBind: "system-items-enabled",
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

export const OtherPage = GObject.registerClass({
	GTypeName: Config.baseGTypeName+'OtherPage',
}, class OtherPage extends Adw.PreferencesPage {
	window: Adw.PreferencesWindow
	constructor(settings: Gio.Settings, _prefs: QstExtensionPreferences, window: Adw.PreferencesWindow) {
		super({
			name: "Other",
			title: _("Other"),
			iconName: "preferences-system-symbolic",
		})

		// System Items
		Group({
			parent: this,
			title: _("System Items"),
			experimental: true,
			headerSuffix: SwitchRow({
				settings,
				bind: "system-items-enabled",
			}),
			description: _("Adjust system items layout"),
		},[
			SwitchRow({
				settings,
				title: _("Hide layout"),
				subtitle: _("Hide all buttons and layout box"),
				bind: "system-items-hide",
				sensitiveBind: "system-items-enabled",
			}),
			DialogRow({
				settings,
				window,
				sensitiveBind: "system-items-enabled",
				title: _("Ordering and Hiding"),
				subtitle: _("Hide all buttons and layout box"),
				dialogTitle: _("Adjust system items layout"),
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
				subtitle: _("Hide notifications on date menu.\n*this option removes media control on date menu too*"),
				bind: "datemenu-remove-notifications",
			}),
			SwitchRow({
				settings,
				title: _("Hide Media Control"),
				subtitle: _("Hide media control on date menu."),
				bind: "datemenu-remove-media-control",
			}),
		])
	}
})
