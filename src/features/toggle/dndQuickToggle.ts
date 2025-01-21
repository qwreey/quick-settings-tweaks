import St from "gi://St"
import Gio from "gi://Gio"
import GObject from "gi://GObject"
import Clutter from "gi://Clutter"
import { QuickToggle, SystemIndicator } from "resource:///org/gnome/shell/ui/quickSettings.js"
import { FeatureBase, SettingLoader } from "../../libs/feature.js"
import { Global } from "../../global.js"

// #region DndQuickToggle
class DndQuickToggle extends QuickToggle {
	_settings: Gio.Settings
	_init() {
		super._init({
			title: _('Do Not Disturb'),
			iconName: "notifications-disabled-symbolic",
		} as Partial<QuickToggle.ConstructorProps>)

		this._settings = new Gio.Settings({
			schema_id: "org.gnome.desktop.notifications",
		})
		// @ts-expect-error missing connectObject type support
		this._settings.connectObject("changed::show-banners", this._sync.bind(this), this)

		this.connect("clicked", this._toggleMode.bind(this))
		this._sync()
	}

	// Update icon to match current state
	_updateIcon() {
		this.iconName =
			this.checked
			? "notifications-disabled-symbolic"
			: "notifications-symbolic"
	}

	// Toggle DND Mode
	_toggleMode() {
		this._settings.set_boolean(
			"show-banners",
			!this._settings.get_boolean("show-banners")
		)
	}

	// Sync DND state
	_sync() {
		const checked = !this._settings.get_boolean("show-banners")
		if (this.checked !== checked) this.set({ checked })
		this._updateIcon()
	}

	// Nullout
	destroy() {
		this._settings = null
		super.destroy()
	}
}
GObject.registerClass(DndQuickToggle)
// #endregion DndQuickToggle

// #region DndIndicator
class DndIndicator extends SystemIndicator {
	_indicator: St.Icon
	_settings: Gio.Settings
	_init() {
		super._init()

		this._indicator = this._addIndicator()
		this._indicator.icon_name = "notifications-disabled-symbolic"

		this.quickSettingsItems.push(new DndQuickToggle())

		this._settings = new Gio.Settings({
			schema_id: "org.gnome.desktop.notifications",
		})
		// @ts-expect-error missing connectObject type support
		this._settings.connectObject("changed::show-banners", this._sync.bind(this), this)
		this._sync()
	}

	_sync() {
		const checked = !this._settings.get_boolean("show-banners")
		if (checked) {
			this._indicator.visible = true
		} else {
			this._indicator.visible = false
		}
	}

	destroy() {
		this.quickSettingsItems.forEach(item => item.destroy())
		this._settings = null
		super.destroy()
	}
}
GObject.registerClass(DndIndicator)
export { DndIndicator }
// #endregion DndIndicator

// #region DndQuickToggleFeature
export class DndQuickToggleFeature extends FeatureBase {
	// #region settings
	enabled: boolean
	override loadSettings(loader: SettingLoader): void {
		this.enabled = loader.loadBoolean("add-dnd-quick-toggle-enabled")
	}
	// #endregion settings

	indicator: DndIndicator
	datemenuDnd: Clutter.Actor
	override onLoad(): void {
		if (!this.enabled) return

		// Create Indicator
		this.maid.destroyJob(
			this.indicator = new DndIndicator()
		)

		// Hide DateMenu DND State Icon
		Global.DateMenuIndicator.hide()
		this.maid.connectJob(Global.DateMenuIndicator, "show", () => Global.DateMenuIndicator.hide())
		this.maid.functionJob(()=>{
			if (!(new Gio.Settings({
				schema_id: "org.gnome.desktop.notifications",
			})).get_boolean("show-banners")) {
				Global.DateMenuIndicator.show()
			}
		})

		// Add to QS
		// @ts-ignore
		Global.QuickSettings.addExternalIndicator(this.indicator)

	}
	override onUnload(): void {
		this.indicator = null
	}
}
// #endregion DndQuickToggleFeature
