import Adw from "gi://Adw"
import GObject from "gi://GObject"
import Gtk from "gi://Gtk"
import Gio from "gi://Gio"

import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js"

import type QstExtensionPreferences from "../prefs.js"
import {
	baseGTypeName,
	Expander,
	Group,
	Row,
} from "../libs/prefComponents.js"

interface Contributor {
	name: string
	label: string
	link: string
	image: string
}
function getContributorRows(pref: QstExtensionPreferences): Contributor[][] {
	const contributors = JSON.parse(
		pref.readExtensionFile("media/contributors/data.json")
	) as Contributor[]
	if (!contributors.length) return []
	const rows: Contributor[][] = [[]]
	contributors.reduce((currentRow: Contributor[], obj: Contributor)=>{
		if (currentRow.length >= 4) rows.push(currentRow = [])
		currentRow.push(obj)
		return currentRow
	}, rows[0])
	return rows
}
interface License {
	url: string
	author: string
	name: string
	file?: string
	content?: string
}
function getLicenses(pref: QstExtensionPreferences): License[] {
	const licenses = JSON.parse(
		pref.readExtensionFile("media/licenses.json")
	) as License[]
	for (const item of licenses) {
		if (item.file) {
			item.content = pref.readExtensionFile(item.file)
		}
	}
	return licenses
}

function LogoBox(): Gtk.Box {
	const logoBox = new Gtk.Box({
		baseline_position: Gtk.BaselinePosition.CENTER,
		// hexpand: false,
		// vexpand: false,
		// homogeneous: true,
		orientation: Gtk.Orientation.VERTICAL,
	})
	const logoImage = new Gtk.Image({
		margin_bottom: 20,
		margin_top: 10,
		icon_name: "project-icon",
		pixel_size: 100,
	})
	logoBox.append(logoImage)
	const logoText = new Gtk.Label({
		label: "Quick Setting Tweaker",
		css_classes: ["title-2"],
		vexpand: true,
		valign: Gtk.Align.FILL,
	})
	logoBox.append(logoText)
	return logoBox
}

function ContributorsRow(row: Contributor[]): Adw.ActionRow {
	const target = Row({})
	const box = new Gtk.Box({
		baseline_position: Gtk.BaselinePosition.CENTER,
		homogeneous: true,
		orientation: Gtk.Orientation.HORIZONTAL,
	})
	target.set_child(box)
	for (const item of row) {
		let itemBox = new Gtk.Box({
			baseline_position: Gtk.BaselinePosition.CENTER,
			orientation: Gtk.Orientation.VERTICAL,
		})
		const itemImage = new Gtk.Image({
			margin_bottom: 2,
			margin_top: 10,
			icon_name: item.image,
			pixel_size: 38,
		})
		itemBox.append(itemImage)
		const nameText = new Gtk.Label({
			label: '<span size="small">'+item.name+'</span>',
			useMarkup: true,
			hexpand: true,
		})
		itemBox.append(nameText)
		const labelText = new Gtk.Label({
			label: '<span size="small">'+item.label+'</span>',
			useMarkup: true,
			hexpand: true,
			opacity: 0.7,
			margin_bottom: 8,
		})
		itemBox.append(labelText)
		box.append(itemBox)
	}
	return target
}

function LicenseRow(item: License): Adw.ExpanderRow {
	return Expander({
		title: "gnome-volume-mixer",
		subtitle: `by ${item.author}`,
		expanded: false,
	},[
		// Row({
		//     title: "Affected on files",
		//     subtitle: 
		// }),
		Row({
			title: "Homepage",
			subtitle: item.url,
			uri: item.url,
		}),
		Row({
			title: "License",
			subtitle: item.content,
		}),
	])
}

export const aboutPage = GObject.registerClass({
	GTypeName: baseGTypeName+'aboutPage',
}, class aboutPage extends Adw.PreferencesPage {
	constructor(_settings: Gio.Settings, pref: QstExtensionPreferences) {
		super({
			name: 'about',
			title: _('About'),
			iconName: 'dialog-information-symbolic'
		})

		// Logo
		Group({
			parent: this,
		},[
			LogoBox(),
		])

		// Informations
		Group({
			parent: this,
		},[
			Row({
				title: _("This extension is distributed with license GPL 3+"),
				subtitle: _("excludes Third-party. Third party codes follow their license"),
			}),
			Row({
				title: _("Extension Version"),
				suffix: new Gtk.Label({
					label: pref.metadata.version?.toString() || _("Unknown (Built from source)")
				}),
			}),
		])

		// Links
		Group({
			parent: this,
			title: _('Links')
		},[
			Row({
				uri: "https://patreon.com/user?u=44216831",
				title: _("Donate via patreon"),
				subtitle: _("Support development!"),
			}),
			Row({
				uri: "https://extensions.gnome.org/extension/5446/quick-settings-tweaker/",
				title: "Gnome Extension",
				subtitle: _("Rate and comment the extension!"),
			}),
			Row({
				uri: "https://github.com/qwreey75/quick-settings-tweaks",
				title: _("Github Repository"),
				subtitle: _("Add Star on Repository is helping me a lot!\nPlease, if you found bug from this extension, you can make issue to make me know that!\nOr, you can create PR with wonderful features!"),
			}),
			Row({
				uri: "https://weblate.paring.moe/projects/gs-quick-settings-tweaks/",
				title: "Webslate",
				subtitle: _("Add translation to this extension!"),
			}),
		])

		// Contributors
		Group({
			parent: this,
			title: _('Contributor'),
			description: _("The creators of this extension"),
		}, getContributorRows(pref).map(ContributorsRow))

		// third party LICENSE
		Group({
			parent: this,
			title: _('Third party LICENSE'),
			description: _('LICENSE OF CODES WHICH USED ON THIS EXTENSION')
		}, getLicenses(pref).map(LicenseRow))
	}
})
