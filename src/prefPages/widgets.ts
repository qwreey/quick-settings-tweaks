import Adw from "gi://Adw"
import GObject from "gi://GObject"
import Gio from "gi://Gio"
import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js"
import Config from "../config.js"
import type QstExtensionPreferences from "../prefs.js"
import {
	SwitchRow,
	AdjustmentRow,
	Group,
	fixPageScrollIssue,
	DialogRow,
	RgbColorRow,
	DropdownRow,
	EntryRow,
} from "../libs/prefComponents.js"

function SliderCustomizes(settings: Gio.Settings, baseName: string, sensitiveBind: string|undefined): any[] {
	// Handle color & radius
	const handleRadius = AdjustmentRow({
		settings,
		max: 1000,
		title: _("Handle radius"),
		subtitle: _("Set this to 0 to use default radius"),
		bind: baseName+"-handle-radius",
		sensitiveBind,
	})
	const handleColor = RgbColorRow({
		settings,
		title: _("Handle color"),
		bind: baseName+"-handle-color",
		sensitiveBind,
		useAlpha: true,
	})
	const updateHandleOptionVisible = ()=>{
		const value = settings.get_string(baseName+"-style")
		handleRadius.visible =
		handleColor.visible = value != "slim"
	}
	const updateHandleOptionVisibleConnection =
		settings.connect(
			`changed::${baseName}-style`,
			updateHandleOptionVisible
		)
	updateHandleOptionVisible()
	handleColor.child.connect("destroy", ()=>{
		settings.disconnect(updateHandleOptionVisibleConnection)
	})

	return [
		DropdownRow({
			settings,
			title: _("Slider style"),
			bind: baseName+"-style",
			items: [
				{ name: _("Slim"), value: "slim" },
				{ name: _("Default"), value: "default" },
			],
			sensitiveBind,
		}),
		handleRadius,
		handleColor,
		RgbColorRow({
			settings,
			title: _("Background color"),
			bind: baseName+"-background-color",
			sensitiveBind,
			useAlpha: true,
		}),
		RgbColorRow({
			settings,
			title: _("Active Background color"),
			bind: baseName+"-active-background-color",
			sensitiveBind,
			useAlpha: true,
		}),
		AdjustmentRow({
			settings,
			title: _("Height"),
			max: 1000,
			bind: baseName+"-height",
			sensitiveBind,
			subtitle: _("Set this to 0 to use default height"),
		})
	]
}

export const WidgetsPage = GObject.registerClass({
	GTypeName: Config.baseGTypeName+"WidgetsPage",
}, class WidgetsPage extends Adw.PreferencesPage {
	constructor(settings: Gio.Settings, _prefs: QstExtensionPreferences, window: Adw.PreferencesWindow) {
		super({
			name: "Widgets",
			title: _("Widgets"),
			iconName: "window-new-symbolic",
		})
		fixPageScrollIssue(this)

		// media
		Group({
			parent: this,
			title: _("Media Widget"),
			headerSuffix: SwitchRow({
				settings,
				bind: "media-enabled",
			}),
			description: _("Turn on to make the media widget visible on the Quick Settings panel"),
		},[
			SwitchRow({
				settings,
				title: _("Compact mode"),
				subtitle: _("Make Media Controls widget smaller\nMake it more similar in size to the notification message"),
				bind: "media-compact",
				sensitiveBind: "media-enabled",
			}),
			AdjustmentRow({
				settings,
				title: _("Control buttons opacity"),
				subtitle: _("Set this to 255 to make opaque, and 0 to make transparent"),
				max: 255,
				bind: "media-contorl-opacity",
				sensitiveBind: "media-enabled",
			}),
			DialogRow({
				window,
				settings,
				title: _("Show progress bar"),
				subtitle: _("Add progress bar under description"),
				dialogTitle: _("Media Widget"),
				experimental: true,
				sensitiveBind: "media-enabled",
				childrenRequest: ()=>[Group({
					title: _("Show progress bar"),
					description: _("Add progress bar under description"),
					header_suffix: SwitchRow({
						settings,
						bind: "media-progress-enabled",
					}),
				}, SliderCustomizes(settings, "media-progress", "media-progress-enabled"))],
			}),
			DialogRow({
				window,
				settings,
				title: _("Gradient background"),
				subtitle: _("Use gradient background extracted from cover image\nMay affect performance"),
				dialogTitle: _("Media Widget"),
				sensitiveBind: "media-enabled",
				experimental: true,
				childrenRequest: ()=>[Group({
					title: _("Gradient background"),
					header_suffix: SwitchRow({
						settings,
						bind: "media-gradient-enabled",
					}),
					description: _("Use gradient background extracted from cover image\nMay affect performance"),
				},[
					RgbColorRow({
						settings,
						title: _("Background color"),
						subtitle: _("Base background color"),
						bind: "media-gradient-background-color",
					}),
					AdjustmentRow({
						settings,
						max: 1000,
						sensitiveBind: "media-gradient-enabled",
						title: _("Start opaque"),
						subtitle: _("Adjust left side transparency, Set this to 1000 to make opaque"),
						bind: "media-gradient-start-opaque",
					}),
					AdjustmentRow({
						settings,
						max: 1000,
						sensitiveBind: "media-gradient-enabled",
						title: _("Start opaque"),
						subtitle: _("Adjust right side background color mixing, Set this to 1000 to show extracted color"),
						bind: "media-gradient-start-mix",
					}),
					AdjustmentRow({
						settings,
						max: 1000,
						sensitiveBind: "media-gradient-enabled",
						title: _("Start opaque"),
						subtitle: _("Adjust right side transparency, Set this to 1000 to make opaque"),
						bind: "media-gradient-end-opaque",
					}),
					AdjustmentRow({
						settings,
						max: 1000,
						sensitiveBind: "media-gradient-enabled",
						title: _("Start opaque"),
						subtitle: _("Adjust right side background color mixing, Set this to 1000 to show extracted color"),
						bind: "media-gradient-end-mix",
					}),
				])],
			}),
			SwitchRow({
				settings,
				title: _("Remove shadow"),
				subtitle: _("Remove shadow from media message\nUse if your theme creates unnecessary shadows"),
				bind: "media-remove-shadow",
				sensitiveBind: "media-enabled",
			}),
			SwitchRow({
				settings,
				title: _("Round clip effect"),
				subtitle: _("Use round clip effect to make transition more natural"),
				bind: "media-round-clip-enabled",
				sensitiveBind: "media-enabled",
			}),
		])

		// notification
		Group({
			parent: this,
			title: _("Notifications Widget"),
			headerSuffix: SwitchRow({
				settings,
				bind: "notifications-enabled"
			}),
			description: _("Turn on to make the notifications widget visible on the Quick Settings panel"),
		},[
			SwitchRow({
				settings,
				title: _("Compact mode"),
				subtitle: _("Make notifications smaller"),
				bind: "notifications-compact",
				sensitiveBind: "notifications-enabled",
			}),
			AdjustmentRow({
				settings,
				title: _("Max height"),
				subtitle: _("Set maximum height of the Notifications widget. default is 292"),
				max: 2048,
				bind: "notifications-max-height",
				sensitiveBind: "notifications-enabled",
			}),
			AdjustmentRow({
				settings,
				title: _("Fade out offset"),
				subtitle: _("Set position of the fade out effect begins. Set this to 0 to disable fade out effect. default is 46"),
				max: 2048,
				bind: "notifications-fade-offset",
				sensitiveBind: "notifications-enabled",
			}),
			SwitchRow({
				settings,
				title: _("Auto hide"),
				subtitle: _("Hide the Notifications widget when have no notifications"),
				bind: "notifications-autohide",
				sensitiveBind: "notifications-enabled",
			}),
			SwitchRow({
				settings,
				title: _("Use native controls"),
				subtitle: _("Use native dnd switch and clear button"),
				bind: "notifications-use-native-controls",
				sensitiveBind: "notifications-enabled",
			}),
			SwitchRow({
				settings,
				title: _("Remove shadow"),
				subtitle: _("Remove shadow from notification message\nUse if your theme creates unnecessary shadows"),
				bind: "notifications-remove-shadow",
				sensitiveBind: "notifications-enabled",
			}),
			SwitchRow({
				settings,
				title: _("Show scrollbar"),
				subtitle: _("Show scrollbar on message list"),
				bind: "notifications-show-scrollbar",
				sensitiveBind: "notifications-enabled",
			}),
		])

		// weather
		Group({
			parent: this,
			title: _("Weather Widget"),
			headerSuffix: SwitchRow({
				settings,
				bind: "weather-enabled"
			}),
			description: _("Turn on to make the weather widget visible on the Quick Settings panel"),
			experimental: true,
		},[
			SwitchRow({
				settings,
				title: _("Compact mode"),
				subtitle: _("Make weather widget smaller"),
				bind: "weather-compact",
				sensitiveBind: "weather-enabled",
			}),
			SwitchRow({
				settings,
				title: _("Remove shadow"),
				subtitle: _("Remove shadow from weather widget\nUse if your theme creates unnecessary shadows"),
				bind: "weather-remove-shadow",
				sensitiveBind: "weather-enabled",
			}),
			EntryRow({
				settings,
				title: _("Click command"),
				bind: "weather-click-command",
				sensitiveBind: "weather-enabled",
			}),
		])
	}
})
