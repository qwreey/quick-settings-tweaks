import Adw from "gi://Adw"
import GObject from "gi://GObject"
import Gtk from "gi://Gtk"
import Gio from "gi://Gio"
import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js"
import type QstExtensionPreferences from "../prefs.js"
import Config from "../config.js"
import {
	ExpanderRow,
	Group,
	Row,
} from "../libs/prefComponents.js"
import { type ExtensionMetadata } from "resource:///org/gnome/shell/extensions/extension.js"

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

interface License {
	url: string
	author: string
	name: string
	file?: string
	content?: string
	licenseUri?: string
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
function LicenseRow(item: License): Adw.ExpanderRow {
	return ExpanderRow({
		title: item.name,
		subtitle: `by ${item.author}`,
		expanded: false,
	},[
		Row({
			title: "Homepage",
			subtitle: item.url,
			uri: item.url,
			icon: "go-home",
		}),
		item.content ? Row({
			title: "License",
			subtitle: item.content,
		}) : null,
		item.licenseUri ? Row({
			title: "License",
			subtitle: item.licenseUri,
			icon: "emblem-documents-symbolic",
			uri: item.licenseUri
		}) : null,
	])
}

function getVersionString(metadata: ExtensionMetadata): string {
	let version = Config.version.toUpperCase().replace(/-.*?$/, "")
	if (metadata.version) {
		version += "." + metadata.version
	}
	version += "   —   "
	if (Config.isReleaseBuild) {
		version += _("Stable") 
	} else if (Config.isDevelopmentBuild) {
		version += _("Development")
	} else {
		version += _("Preview")
	}
	if (Config.isGithubBuild) {
		version += "  " + _("(Github Release)")
	} else if (!metadata.version) {
		version += "  " + _("(Built from source)")
	}
	return version
}
function LogoBox(metadata: ExtensionMetadata): Gtk.Box {
	const logoBox = new Gtk.Box({
		baseline_position: Gtk.BaselinePosition.CENTER,
		margin_top: 10,
		spacing: 20,
		orientation: Gtk.Orientation.VERTICAL,
	})

	// Logo icon
	const logoImage = new Gtk.Image({
		icon_name: "qst-project-icon",
		pixel_size: 100,
	})
	logoBox.append(logoImage)

	// Extension name
	const logoText = new Gtk.Label({
		label: metadata.name,
		css_classes: ["title-2"],
		halign: Gtk.Align.CENTER,
	})
	logoBox.append(logoText)

	// Version
	const logoVersion = new Gtk.Button({
		css_classes: ["success"],
		label: getVersionString(metadata),
		halign: Gtk.Align.CENTER,
	})
	logoBox.append(logoVersion)

	return logoBox
}

export const AboutPage = GObject.registerClass({
	GTypeName: Config.baseGTypeName+'AboutPage',
}, class AboutPage extends Adw.PreferencesPage {
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
			LogoBox(pref.metadata),
		])

		// Links
		Group({
			parent: this,
			title: _('Links'),
		},[
			Row({
				uri: "https://patreon.com/user?u=44216831",
				title: _("Donate via patreon"),
				subtitle: _("Support development!"),
				icon: "qst-patreon-logo-symbolic",
			}),
			Row({
				uri: "https://extensions.gnome.org/extension/5446/quick-settings-tweaker/",
				title: "Gnome Extension",
				subtitle: _("Rate and comment the extension!"),
				icon: "qst-gnome-extension-logo-symbolic",
			}),
			Row({
				uri: "https://github.com/qwreey75/quick-settings-tweaks",
				title: _("Github Repository"),
				subtitle: _("Add Star on Repository is helping me a lot!\nPlease, if you found bug from this extension, you can make issue to make me know that!\nOr, you can create PR with wonderful features!"),
				icon: "qst-github-logo-symbolic",
			}),
			Row({
				uri: "https://weblate.paring.moe/projects/gs-quick-settings-tweaks/",
				title: "Webslate",
				subtitle: _("Add translation to this extension!"),
				icon: "qst-weblate-logo-symbolic",
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
			title: _('License'),
			description: _('License of codes')
		}, getLicenses(pref).map(LicenseRow))
	}
})
