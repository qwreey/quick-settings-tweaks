import Adw from "gi://Adw"
import GObject from "gi://GObject"
import Gio from "gi://Gio"
import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js"
import type QstExtensionPreferences from "../prefs.js"
import Config from "../config.js"
import {
	Group,
	Row,
	ContributorsRow,
	LicenseRow,
	LogoGroup,
	ChangelogDialog,
} from "../libs/prefComponents.js"

export const AboutPage = GObject.registerClass({
	GTypeName: Config.baseGTypeName+'AboutPage',
}, class AboutPage extends Adw.PreferencesPage {
	constructor(_settings: Gio.Settings, prefs: QstExtensionPreferences, window: Adw.PreferencesWindow) {
		super({
			name: 'about',
			title: _('About'),
			iconName: 'dialog-information-symbolic'
		})

		// Logo
		LogoGroup({
			parent: this,
			name: prefs.metadata.name,
			icon: "qst-project-icon",
			version: prefs.getVersionString(),
		})

		// Links
		Group({
			parent: this,
			// title: _('Links'),
		},[
			Row({
				title: _("Changelog"),
				subtitle: _("Support development!"),
				action: ()=>ChangelogDialog({ window, content: async () => prefs.getChangelog() }),
				icon: "qst-patreon-logo-symbolic",
			}),
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
		}, prefs.getContributorRows().map(ContributorsRow))

		// third party LICENSE
		Group({
			parent: this,
			title: _('License'),
			description: _('License of codes')
		}, prefs.getLicenses().map(LicenseRow))
	}
})
