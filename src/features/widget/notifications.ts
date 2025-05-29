import GObject from "gi://GObject"
import St from "gi://St"
import Clutter from "gi://Clutter"
import * as MessageList from "resource:///org/gnome/shell/ui/messageList.js"
import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js"
import { type DoNotDisturbSwitch } from "resource:///org/gnome/shell/ui/calendar.js"
import { FeatureBase, type SettingLoader } from "../../libs/shell/feature.js"
import { StyledScroll } from "../../libs/shell/styler.js"
import Global from "../../global.js"
import { VerticalProp } from "../../libs/shell/compat.js"

// #region Placeholder
class Placeholder extends St.BoxLayout {
	_icon: St.Icon
	_label: St.Label

	_init() {
		super._init({
			...VerticalProp,
			style_class: "QSTWEAKS-placeholder",
			x_align: Clutter.ActorAlign.CENTER,
			opacity: 60,
		} as Partial<St.BoxLayout>)

		// Symbolic Icon
		this._icon = new St.Icon({
			style_class: "QSTWEAKS-icon",
			icon_name: "no-notifications-symbolic"
		})
		this.add_child(this._icon)

		// No Notifications Label
		this._label = new St.Label({ text: _("No Notifications") })
		this.add_child(this._label)
	}
}
GObject.registerClass(Placeholder)
// #endregion Placeholder

// #region ClearButton
class ClearButton extends St.Button {
	_icon: St.Icon
	_label: St.Label
	_container: St.BoxLayout

	_init() {
		// Child Container
		this._container = new St.BoxLayout({
			x_expand: true,
			y_expand: true,
		})

		// Button
		super._init({
			style_class: "QSTWEAKS-clear-button",
			button_mask: St.ButtonMask.ONE,
			child: this._container,
			reactive: true,
			can_focus: true,
			y_align: Clutter.ActorAlign.CENTER,
		} as Partial<St.Button.ConstructorProps>)

		// Icon
		this._icon = new St.Icon({
			style_class: "QSTWEAKS-icon",
			icon_name: "user-trash-symbolic",
			icon_size: 12
		})
		this._container.add_child(this._icon)

		// Label
		this._label = new St.Label({
			text: _("Clear")
		})
		this._container.add_child(this._label)
	}
}
GObject.registerClass(ClearButton)
// #endregion ClearButton

// #region Header
class Header extends St.BoxLayout {
	_headerLabel: St.Label
	_clearButton: ClearButton

	constructor(options: Header.Options) {
		super(options)
	}
	_init(options: Header.Options) {
		super._init({
			style_class: "QSTWEAKS-header"
		} as Partial<St.BoxLayout.ConstructorProps>)

		// Label
		this._headerLabel = new St.Label({
			text: _("Notifications"),
			style_class: "QSTWEAKS-header-label",
			y_align: Clutter.ActorAlign.CENTER,
			x_align: Clutter.ActorAlign.START,
			x_expand: true
		})
		this.add_child(this._headerLabel)

		// Clear button
		if (options.createClearButton) {
			this._clearButton = new ClearButton()
			this.add_child(this._clearButton)
		}
	}
}
GObject.registerClass(Header)
namespace Header {   
	export type Options = Partial<{
		createClearButton: boolean
	} & St.BoxLayout.ConstructorProps>
}
// #endregion Header

// #region NativeControl
class NativeControl extends St.BoxLayout {
	_clearButton: St.Button
	_dndButton: St.Button
	_dndLabel: St.Label
	_dndSwitch: DoNotDisturbSwitch

	_init() {
		// See : https://github.com/GNOME/gnome-shell/blob/934dbe549567f87d7d6deb6f28beaceda7da1d46/js/ui/calendar.js#L979
		super._init({
			style_class: "QSTWEAKS-native-controls",
		} as Partial<St.BoxLayout.ConstructorProps>)

		// DND Switch
		this._dndSwitch = new (Global.MessageList._dndSwitch.constructor as any)() // Calendar.DoNotDisturbSwitch();
		this._dndSwitch.style_class += " QSTWEAKS-native-dnd-switch"
		
		// DND Label
		this._dndLabel = new St.Label({
			style_class: "QSTWEAKS-native-dnd-text",
			text: _("Do Not Disturb"),
			y_align: Clutter.ActorAlign.CENTER,
		})
		this.add_child(this._dndLabel)
		this._dndButton = new St.Button({
			style_class: "dnd-button",
			can_focus: true,
			toggle_mode: true,
			child: this._dndSwitch,
			label_actor: this._dndLabel,
			y_align: Clutter.ActorAlign.CENTER,
		})
		this._dndSwitch.bind_property("state",
			this._dndButton, "checked",
			GObject.BindingFlags.BIDIRECTIONAL | GObject.BindingFlags.SYNC_CREATE)
		this.add_child(this._dndButton)

		// Clear Button
		this._clearButton = new St.Button({
			style_class: "message-list-clear-button button QSTWEAKS-native-clear-button",
			label: _("Clear"),
			can_focus: true,
			x_expand: true,
			x_align: Clutter.ActorAlign.END,
			accessible_name: C_("action", "Clear all notifications"),
		})
		this.add_child(this._clearButton)
	}
}
GObject.registerClass(NativeControl)
// #endregion NativeControl

// #region NotificationList
class NotificationList extends MessageList.NotificationMessageGroup {
	_nUrgent: number

	_init() {
		super._init()

		this._nUrgent = 0

		Global.MessageTray.connectObject(
			"source-added",
			this._sourceAdded.bind(this),
			this
		)
		Global.MessageTray.getSources().forEach(source => {
			this._sourceAdded(Global.MessageTray, source)
		})

		// sync notifications from gnome stock notifications
		// @ts-ignore
		Global.NotificationSection._messages.forEach((notification) => {
			this._onNotificationAdded(null, notification.notification)
		})
	}

	// See : https://github.com/GNOME/gnome-shell/blob/934dbe549567f87d7d6deb6f28beaceda7da1d46/js/ui/calendar.js#L866
	_sourceAdded(tray, source) {
		// @ts-ignore
		Global.NotificationSection._sourceAdded.call(this, tray, source)
	}

	// See : https://github.com/GNOME/gnome-shell/blob/934dbe549567f87d7d6deb6f28beaceda7da1d46/js/ui/calendar.js#L871
	_onNotificationAdded(source, notification) {
		// @ts-ignore
		Global.NotificationSection._onNotificationAdded.call(this, source, notification)
	}

	// See : https://github.com/GNOME/gnome-shell/blob/934dbe549567f87d7d6deb6f28beaceda7da1d46/js/ui/calendar.js#L900
	vfunc_map() {
		// @ts-ignore
		Global.NotificationSection.vfunc_map.call(this)
	}
}
GObject.registerClass(NotificationList)
// #endregion NotificationList

// #region NotificationWidget
class NotificationWidget extends St.BoxLayout {
	_options: NotificationWidget.Options
	_header: Header
	_placeholder: Placeholder
	_list: NotificationList
	_scroll: St.ScrollView
	_nativeControl: NativeControl
	_sections: St.BoxLayout
	constructor(options: NotificationWidget.Options) {
		super(options)
	}
	_init(options: NotificationWidget.Options) {
		super._init({
			...VerticalProp,
		} as Partial<St.BoxLayout.ConstructorProps>)

		this._options = options

		this._createScroll()
		this._createHeaderArea()
		this._createPlaceholder()
		this._createNativeControl()

		this.add_child(this._header)
		this.add_child(this._scroll)
		if (this._placeholder) this.add_child(this._placeholder)
		if (this._nativeControl) this.add_child(this._nativeControl)

		this._list.connectObject(
			"notify::empty",
			this._syncEmpty.bind(this),
			this
		)
		this._list.connectObject(
			"notify::can-clear",
			this._syncClear.bind(this),
			this
		)
		this._syncEmpty()
		this._syncClear()
		this._updateMaxHeight()
		this._updateStyleClass()
	}

	// Box style
	_updateMaxHeight() {
		const maxHeight = this._options.maxHeight
		this.style = maxHeight
			? `max-height:${maxHeight}px;`
			: ""
	}
	_updateStyleClass() {
		const options = this._options
		let style = "QSTWEAKS-notifications"
		if (options.useNativeControls) style += " QSTWEAKS-use-native-controls"
		if (options.compact) style += " QSTWEAKS-message-compact"
		if (options.removeShadow) style += " QSTWEAKS-message-remove-shadow"
		this.style_class = style
	}

	// Scroll view
	_createScroll() {
		this._sections = new St.BoxLayout({
			...VerticalProp,
			x_expand: true,
			y_expand: true,
		})
		this._scroll = new St.ScrollView({
			x_expand: true,
			y_expand: true,
			child: this._sections,
		})
		this._updateScrollStyle()
		this._scroll.connectObject(
			"notify::vscrollbar-visible",
			this._syncScrollbarPadding.bind(this),
			this
		)
		this._syncScrollbarPadding()
		this._list = new NotificationList()
		this._sections.add_child(this._list)
	}
	_updateScrollStyle() {
		StyledScroll.updateStyle(this._scroll, this._options.scrollStyle)
	}
	_syncScrollbarPadding() {
		this._sections.style_class =
			this._scroll.vscrollbar_visible
			? "message-list-sections QSTWEAKS-has-scrollbar"
			: "message-list-sections"
	}

	_createHeaderArea() {
		const header = this._header = new Header({ createClearButton: !this._options.useNativeControls })

		if (header._clearButton) {
			header._clearButton.connectObject(
				"clicked",
				this._list.clear.bind(this._list),
				this
			)
		}
	}
	_createPlaceholder() {
		if (this._options.autoHide) return
		this._placeholder = new Placeholder()
	}
	_createNativeControl() {
		if (!this._options.useNativeControls) return
		this._nativeControl = new NativeControl()
		this._nativeControl._clearButton.connectObject(
			"clicked",
			this._list.clear.bind(this._list),
			this
		)
	}

	// See : https://github.com/GNOME/gnome-shell/blob/934dbe549567f87d7d6deb6f28beaceda7da1d46/js/ui/calendar.js#L1043
	_syncClear() {
		// Sync clear button reactive
		const canClear = this._list.canClear
		if (this._nativeControl) {
			this._nativeControl._clearButton.reactive = canClear
		}
		const clearButton = this._header._clearButton
		if (clearButton) {
			clearButton.visible = canClear
		}
	}
	_syncEmpty() {
		// placeholder / autohide
		const empty = this._list.empty
		if (this._options.autoHide) {
			this.visible = !empty
		} else {
			this._scroll.visible = !empty
			this._placeholder.visible = empty
		}
	}
}
GObject.registerClass(NotificationWidget)
namespace NotificationWidget {
	export type Options = {
		useNativeControls: boolean
		autoHide: boolean
		maxHeight: number
		compact: boolean
		removeShadow: boolean
		scrollStyle: StyledScroll.Options
	}
		& Partial<St.BoxLayout.ConstructorProps>
}
// #endregion NotificationWidget

// #region NotificationsWidgetFeature
export class NotificationsWidgetFeature extends FeatureBase {
	// #region settings
	enabled: boolean
	useNativeControls: boolean
	autoHide: boolean
	maxHeight: number
	compact: boolean
	removeShadow: boolean
	header: boolean
	scrollStyle: StyledScroll.Options
	override loadSettings(loader: SettingLoader): void {
		this.enabled = loader.loadBoolean("notifications-enabled")
		this.useNativeControls = loader.loadBoolean("notifications-use-native-controls")
		this.autoHide = loader.loadBoolean("notifications-autohide")
		this.maxHeight = loader.loadInt("notifications-max-height")
		this.compact = loader.loadBoolean("notifications-compact")
		this.removeShadow = loader.loadBoolean("notifications-remove-shadow")
		this.header = loader.loadBoolean("notifications-show-header")
		this.scrollStyle = StyledScroll.Options.fromLoader(loader, "notifications")
	}
	// #endregion settings

	notificationWidget: NotificationWidget
	override reload(key: string): void {
		switch (key) {
			case "notifications-max-height":
				if (!this.enabled) return
				this.notificationWidget!._updateMaxHeight()
				break
			case "notifications-compact":
			case "notifications-remove-shadow":
				if (!this.enabled) return
				this.notificationWidget!._updateStyleClass()
				break
			case "notifications-fade-offset":
			case "notifications-show-scrollbar":
				if (!this.enabled) return
				this.notificationWidget!._updateScrollStyle()
				break
			default:
				super.reload()
				break
		}
	}
	override onLoad(): void {
		if (!this.enabled) return

		// Create Notification Box
		this.maid.destroyJob(
			this.notificationWidget = new NotificationWidget(this)
		)

		// Add to grid
		Global.QuickSettingsGrid.add_child(this.notificationWidget)
		Global.QuickSettingsGrid.layout_manager.child_set_property(
			Global.QuickSettingsGrid, this.notificationWidget, "column-span", 2
		)
	}
	override onUnload(): void {
		this.notificationWidget = null
	}
}
// #endregion NotificationsWidgetFeature
