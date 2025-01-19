import Adw from "gi://Adw"
import GObject from "gi://GObject"
import Gio from "gi://Gio"

import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js"
import { type OrderItem } from "../features/quickToggles.js"
import {
	baseGTypeName,
	SwitchRow,
	Group,
} from "../libs/prefComponents.js"

export const quickTogglesPage = GObject.registerClass({
	GTypeName: baseGTypeName+'quickTogglesPage',
}, class quickTogglesPage extends Adw.PreferencesPage {
	constructor(settings: Gio.Settings) {
		super({
			name: 'quickToggles',
			title: _('Quick Toggles'),
			iconName: 'view-grid-symbolic',
		})

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

		const IGNORE_XGETTEXT=_
		const SystemToggleNames = {
			NMWiredToggle: IGNORE_XGETTEXT("Wired Connections"),
			NMWirelessToggle: IGNORE_XGETTEXT("Wi-Fi"),
			NMModemToggle: IGNORE_XGETTEXT("Mobile Connections"),
			NMBluetoothToggle: IGNORE_XGETTEXT("Bluetooth Tethers"),
			NMVpnToggle: IGNORE_XGETTEXT("VPN"),
			BluetoothToggle: IGNORE_XGETTEXT("Bluetooth"),
			PowerProfilesToggle: IGNORE_XGETTEXT("Power Mode"),
			NightLightToggle: IGNORE_XGETTEXT("Night Light"),
			DarkModeToggle: IGNORE_XGETTEXT("Dark Style"),
			KeyboardBrightnessToggle: IGNORE_XGETTEXT("Keyboard"),
			RfkillToggle: IGNORE_XGETTEXT("Airplane Mode"),
			RotationToggle: IGNORE_XGETTEXT("Auto Rotate"),
			DndQuickToggle: _("Do Not Disturb"),
			UnsafeQuickToggle: _("Unsafe Mode"),
		}
		// Order
		Group({
			parent: this,
			title: _("Ordering and Hiding"),
			description: _("Reorder and hide quick toggles"),
			headerSuffix: SwitchRow({
				settings,
				bind: "quick-toggle-order-enabled",
			}),
		},[
			
		])

		// description / enable
		// const descriptionGroup = new Adw.PreferencesGroup({
		//     title: _('Buttons to remove'),
		//     description: _('Turn on the buttons you want to remove from Quick Settings')
		// })
		// makeRow({
		//     parent: descriptionGroup,
		//     title: _("Remove chosen buttons from quick panel"),
		//     subtitle: _("Forked from my extension https://github.com/qwreey75/gnome-quick-settings-button-remover")
		// })
		// makeRow({
		//     parent: descriptionGroup,
		//     title: _("This feature is unstable sometime"),
		//     subtitle: _("When lock/unlock with gnome-screensaver, unexpected behavior occurs\nPlease do not report issue about known issue, Almost duplicated\nKnown issue:\n  button doesn't remove after lockscreen\n  modal get bigger after lockscreen")
		// })
		// makeRow({
		//     parent: descriptionGroup,
		//     title: _("Please turn off if some bug occurred")
		// })
		// this.add(descriptionGroup)

		// // general
		// const removeGroup = new Adw.PreferencesGroup()
		// this.add(removeGroup)

		// let listButtons = JSON.parse(settings.get_string("list-buttons"))
		// let removedButtons = settings.get_strv("user-removed-buttons")
		// for (let button of listButtons) {
		//     makeSwitch({
		//         title: (button.name || _("Unknown")) + (button.visible ? "" : _(" (invisible by system)")),
		//         subtitle: button.title,
		//         parent: removeGroup,
		//         value: removedButtons.includes(button.name),
		//         action: (active)=>{
		//             if (active) {
		//                 removedButtons.push(button.name)
		//             } else {
		//                 while (true) {
		//                     let index = removedButtons.indexOf(button.name)
		//                     if (index != -1) {
		//                         removedButtons.splice(index,1)
		//                     } else break
		//                 }
		//             }
		//             settings.set_strv("user-removed-buttons",removedButtons)
		//         }
		//     })
		// }
	}
})
