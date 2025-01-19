
import Adw from "gi://Adw"
import Gio from "gi://Gio"
import Gtk from "gi://Gtk"
import Gdk from "gi://Gdk"
import GObject from "gi://GObject"

import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js"

function addChildren(target: any, funcName: string, children?: any[]) {
	if (!children) return
	for (const item of children) {
		if (!item) continue
		target[funcName](item)
	}
}

export function ExperimentalIcon(options?: ExperimentalIcon.Options): Gtk.Image {
	return new Gtk.Image({
		css_classes: ["icon"],
		icon_name: "applications-science-symbolic",
		pixel_size: options?.pixelSize ?? 16,
		margin_end: options?.marginEnd ?? 4,
		margin_start: options?.marginStart ?? 2,
		opacity: 0.8,
		has_tooltip: true,
		tooltip_text: _("This feature marked as experimental"),
	})
}
export namespace ExperimentalIcon {
	export interface Options {
		marginEnd?: number
		marginStart?: number
		pixelSize?: number
	}
	export function prependExperimentalIcon(holder: Gtk.Widget, options?: ExperimentalIcon.Options) {
		ExperimentalIcon(options).insert_before(holder,holder.get_first_child())
	}
}

export function Group(options: Group.Options, children?: any[]): Adw.PreferencesGroup {
	options.title ??= ""
	const { experimental, parent, onCreated, nesting } = options
	delete options.parent
	delete options.experimental
	delete options.onCreated
	delete options.nesting
	const target = new Adw.PreferencesGroup(options)
	if (nesting) target.marginTop = 14
	if (experimental) ExperimentalIcon.prependExperimentalIcon(
		target.get_first_child().get_first_child(),
		{ marginEnd: 18, marginStart: 4, pixelSize: 20 }
	)
	addChildren(target, "add", children)
	if (parent) parent.add(target)
	if (onCreated) onCreated(target)
	return target
}
export namespace Group {
	export type Options = Partial<Adw.PreferencesGroup.ConstructorProps & {
		parent: any,
		experimental: boolean,
		nesting: boolean,
		onCreated?: (row: Adw.PreferencesGroup)=>void,
	}>
}

export function Row({
	settings,
	parent,
	title,
	subtitle,
	uri,
	icon,
	sensitiveBind,
	suffix,
	prefix,
	experimental,
	onCreated,
}: Row.Options): Adw.ActionRow {
	const row = new Adw.ActionRow({
		title: title ?? null,
		subtitle: subtitle ?? null,
		activatable: !!uri,
	})
	if (parent) {
		parent.add(row)
	}
	if (uri) {
		row.connect("activated", ()=>{
			Gio.AppInfo.launch_default_for_uri_async(uri, null, null, null)
		})
		row.add_suffix(new Gtk.Image({
			css_classes: ["icon"],
			icon_name: "adw-external-link-symbolic",
			pixel_size: 16,
			valign: Gtk.Align.CENTER,
		}))
		row.cursor = Gdk.Cursor.new_from_name("pointer", null)
		row.tooltip_text = uri
		row.has_tooltip = true
	}
	if (icon) Row.appendLinkIcon(row, icon)
	if (suffix) {
		row.add_suffix(suffix)
	}
	if (prefix) {
		row.add_prefix(prefix)
	}
	if (sensitiveBind) {
		settings.bind(
			sensitiveBind,
			row, 'sensitive',
			Gio.SettingsBindFlags.DEFAULT
		)
		row.sensitive = settings.get_boolean(sensitiveBind)
	}
	if (experimental) ExperimentalIcon.prependExperimentalIcon(row.child)
	if (onCreated) onCreated(row)
	return row
}
export namespace Row {
	export interface Options {
		parent?: any
		title?: string
		subtitle?: string
		uri?: string
		icon?: string
		settings?: Gio.Settings
		sensitiveBind?: string
		suffix?: Gtk.Widget
		prefix?: Gtk.Widget
		experimental?: boolean
		onCreated?: (row: Adw.ActionRow)=>void
	}
	export function appendLinkIcon(row: any, name: string) {
		const linkText = row.child.get_first_child()
		linkText.margin_start = 32
		const image = new Gtk.Image({
			css_classes: ["icon"],
			icon_name: name,
			pixel_size: 20,
			margin_start: 2,
			margin_end: 2,
			halign: Gtk.Align.START,
		})
		image.insert_before(row.child, linkText)
	}
}

export function ResetButton(options: ResetButton.Options): Gtk.Box {
	const { settings, bind } = options
	options.iconName ??= "view-refresh-symbolic"
	const box = Button({
		...options,
		onCreated: null,
	})
	box.halign = Gtk.Align.END
	const button: Gtk.Button = box.get_first_child() as any
	button.valign = Gtk.Align.CENTER
	button.has_frame = false
	button.tooltip_text = _("Reset to default")
	button.connect("clicked", ()=>settings.reset(bind))
	const image: Gtk.Image = button.get_first_child() as any
	image.pixel_size = 12
	image.opacity = 0.75
	const setVisible = ()=>{
		const state = ResetButton.getOptionState(settings, bind)
		box.visible = options.dontHideWhenMatch ? state.isSet : (!state.isMatch)
	}
	const settingsConnection = settings.connect(`changed::${bind}`, setVisible)
	setVisible()
	box.connect("destroy", ()=>{
		settings.disconnect(settingsConnection)
	})
	return box
}
export namespace ResetButton {
	export interface Options extends Button.OptionsBase {
		bind: string,
		dontHideWhenMatch?: boolean
	}
	export function getOptionState(settings: Gio.Settings, key: string): {
		isMatch: boolean,
		isSet: boolean,
	} {
		const userValue = settings.get_user_value(key)
		const defaultValue = settings.get_default_value(key)
		return {
			isSet: userValue != null,
			isMatch:
				(userValue == null)
				|| (userValue && defaultValue && userValue.equal(defaultValue)),
		}
	}
	export function pushResetButton(row_with_suffix: Adw.ActionRow, options: ResetButton.Options) {
		const suffixes = row_with_suffix
		.get_first_child() // GtkBox header
		.get_last_child() // GtkBox suffixes

		ResetButton(options)
		.insert_before(
			suffixes, suffixes.get_first_child()
		)
	}
}

export function SwitchRow({
	bind,
	parent,
	value,
	title,
	subtitle,
	action,
	sensitiveBind,
	settings,
	experimental,
	noResetButton,
	onCreated,
}: SwitchRow.Options): Adw.SwitchRow {
	if (bind) value ??= settings.get_boolean(bind)

	const row = new Adw.SwitchRow({
		title: title ?? "",
		subtitle: subtitle ?? null,
		active: value,
	})

	if (action) {
		row.connect("notify::active", () => action(row.get_active()))
	}

	if (parent) {
		parent.add(row)
	}

	if (bind) {
		settings.bind(
			bind,
			row, 'active',
			Gio.SettingsBindFlags.DEFAULT
		)
		if (!noResetButton) ResetButton.pushResetButton(row, { settings, bind })
	}

	if (sensitiveBind) {
		settings.bind(
			sensitiveBind,
			row, 'sensitive',
			Gio.SettingsBindFlags.DEFAULT
		)
		row.sensitive = settings.get_boolean(sensitiveBind)
	}
	if (experimental) ExperimentalIcon.prependExperimentalIcon(row.child)
	if (onCreated) onCreated(row)

	return row
}
export namespace SwitchRow {
	export interface Options {
		settings?: Gio.Settings
		value?: boolean
		bind?: string
		parent?: any
		title?: string
		subtitle?: string
		action?: (value: boolean)=>void
		sensitiveBind?: string
		experimental?: boolean
		noResetButton?: boolean
		onCreated?: (row: Adw.SwitchRow)=>void
	}
}

export function ToggleButtonRow({
	bind,
	parent,
	value,
	title,
	subtitle,
	action,
	sensitiveBind,
	settings,
	experimental,
	text,
	noResetButton,
	onCreated,
}: ToggleButtonRow.Options): Adw.ActionRow {
	if (bind) value ??= settings.get_boolean(bind)

	const row = new Adw.ActionRow({
		title: title ?? "",
		subtitle: subtitle ?? null,
	})
	const box = new Gtk.Box({
		margin_bottom: 8,
		margin_top: 8,
	})
	const toggle = new Gtk.ToggleButton({
		label: text,
		active: value,
	})
	box.insert_child_after(toggle, null)
	row.add_suffix(box)

	if (action) {
		toggle.connect("notify::active", () => action(toggle.get_active()))
	}

	if (parent) {
		parent.add(row)
	}

	if (bind) {
		settings.bind(
			bind,
			toggle, 'active',
			Gio.SettingsBindFlags.DEFAULT
		)
		if (!noResetButton) ResetButton.pushResetButton(row, { settings, bind })
	}

	if (sensitiveBind) {
		settings.bind(
			sensitiveBind,
			row, 'sensitive',
			Gio.SettingsBindFlags.DEFAULT
		)
		row.sensitive = settings.get_boolean(sensitiveBind)
		settings.bind(
			sensitiveBind,
			toggle, 'sensitive',
			Gio.SettingsBindFlags.DEFAULT
		)
		toggle.sensitive = settings.get_boolean(sensitiveBind)
	}
	if (experimental) ExperimentalIcon.prependExperimentalIcon(row.child)
	if (onCreated) onCreated(row)

	return row
}
export namespace ToggleButtonRow {
	export interface Options {
		settings?: Gio.Settings
		value?: boolean
		bind?: string
		parent?: any
		title?: string
		subtitle?: string
		action?: (value: boolean)=>void
		sensitiveBind?: string
		experimental?: boolean
		text?: string
		noResetButton?: boolean
		onCreated?: (row: Adw.ActionRow)=>void
	}
}

export function Button({
	parent,
	action,
	sensitiveBind,
	settings,
	text,
	marginTop,
	marginBottom,
	iconName,
	onCreated,
}: Button.Options): Gtk.Box {
	const box = new Gtk.Box({
		margin_bottom: marginBottom ?? 8,
		margin_top: marginTop ?? 8,
	})
	const button = new Gtk.Button()
	box.insert_child_after(button, null)
	if (iconName) {
		button.icon_name = iconName
	}
	if (text) {
		button.label = text
	}

	if (action) {
		button.connect("activate", () => action())
	}

	if (parent) {
		parent.add(box)
	}

	if (sensitiveBind) {
		settings.bind(
			sensitiveBind,
			button, 'sensitive',
			Gio.SettingsBindFlags.DEFAULT
		)
		button.sensitive = settings.get_boolean(sensitiveBind)
	}
	if (onCreated) onCreated(box)

	return box
}
export namespace Button {
	export interface Options extends OptionsBase {
		onCreated?: (row: Gtk.Box)=>void
	}
	export interface OptionsBase {
		settings?: Gio.Settings
		parent?: any
		action?: ()=>void
		sensitiveBind?: string
		text?: string
		marginTop?: number
		marginBottom?: number
		iconName?: string
	}
}

export function ButtonRow(options: ButtonRow.Options): Adw.ActionRow {
	const {
		parent,
		title,
		subtitle,
		experimental,
		onCreated,
	} = options
	const row = new Adw.ActionRow({
		title: title ?? "",
		subtitle: subtitle ?? null,
	})
	row.add_suffix(Button({
		...options,
		onCreated: null,
	}))

	if (parent) {
		parent.add(row)
	}

	if (experimental) ExperimentalIcon.prependExperimentalIcon(row.child)
	if (onCreated) onCreated(row)

	return row
}
export namespace ButtonRow {
	export interface Options extends Button.OptionsBase {
		settings?: Gio.Settings
		parent?: any
		title?: string
		subtitle?: string
		action?: ()=>void
		sensitiveBind?: string
		experimental?: boolean
		text?: string
		marginTop?: number
		marginBottom?: number
		onCreated?: (row: Adw.ActionRow)=>void
	}
}

export function UpDownButton({
	parent,
	action,
	sensitiveBind,
	settings,
	marginTop,
	marginBottom,
	spacing,
	onCreated,
}: UpDownButton.Options): Gtk.Box {
	const box = new Gtk.Box({
		margin_bottom: marginTop ?? 8,
		margin_top: marginBottom ?? 8,
		spacing: spacing ?? 8
	})
	const down = new Gtk.Button({
		icon_name: "go-down-symbolic"
	})
	const up = new Gtk.Button({
		icon_name: "go-up-symbolic"
	})
	box.insert_child_after(up, null)
	box.insert_child_after(down, up)

	if (action) {
		down.connect("activate", () => action(UpDownButton.Direction.Down))
		up.connect("activate", () => action(UpDownButton.Direction.Up))
	}

	if (parent) {
		parent.add(box)
	}

	if (sensitiveBind) {
		settings.bind(
			sensitiveBind,
			up, 'sensitive',
			Gio.SettingsBindFlags.DEFAULT
		)
		up.sensitive = settings.get_boolean(sensitiveBind)
		settings.bind(
			sensitiveBind,
			down, 'sensitive',
			Gio.SettingsBindFlags.DEFAULT
		)
		down.sensitive = settings.get_boolean(sensitiveBind)
	}
	if (onCreated) onCreated(box)

	return box
}
export namespace UpDownButton {
	export interface Options {
		settings?: Gio.Settings
		parent?: any
		marginTop?: number
		marginBottom?: number
		spacing?: number
		action?: (direction: Direction)=>void
		sensitiveBind?: string
		onCreated?: (row: Gtk.Box)=>void
	}
	export enum Direction {
		Up,
		Down,
	}
}

export function AdjustmentRow({
	max,
	min,
	stepIncrement,
	pageIncrement,
	bind,
	parent,
	value,
	title,
	subtitle,
	action,
	sensitiveBind,
	settings,
	experimental,
	noResetButton,
	onCreated,
}: AdjustmentRow.Options): Adw.SpinRow {
	if (bind) value ??= settings.get_int(bind)

	const row = new Adw.SpinRow({
		title: title ?? "",
		subtitle: subtitle ?? null,
		adjustment: new Gtk.Adjustment({
			upper: max ?? 100,
			lower: min ?? 0,
			stepIncrement: stepIncrement ?? 1,
			pageIncrement: pageIncrement ?? 10,
			value: value
		}),
	})
	const header = row
	.get_first_child() // GtkBox header
	const suffixes = header
	.get_last_child() // GtkBox suffixes
	const spin = suffixes
	.get_first_child() // GtkSpinButton spin_button
	spin.hexpand = false
	suffixes.hexpand = false
	new Gtk.Box({ hexpand: true }).insert_before(header, suffixes)

	if (action) {
		row.connect("notify::value", () => {
			action(row.get_value())
		})
	}

	if (parent) {
		parent.add(row)
	}

	if (bind) {
		settings.bind(
			bind,
			row, 'value',
			Gio.SettingsBindFlags.DEFAULT
		)
		if (!noResetButton) ResetButton.pushResetButton(row, { settings, bind })
	}

	if (sensitiveBind) {
		settings.bind(
			sensitiveBind,
			row, 'sensitive',
			Gio.SettingsBindFlags.DEFAULT
		)
		row.sensitive = settings.get_boolean(sensitiveBind)
	}
	if (experimental) ExperimentalIcon.prependExperimentalIcon(row.child)
	if (onCreated) onCreated(row)

	return row
}
export namespace AdjustmentRow {
	export interface Options {
		settings?: Gio.Settings
		max?: number
		min?: number
		stepIncrement?: number
		pageIncrement?: number
		bind?: string
		parent?: any
		value?: number
		title?: string
		subtitle?: string
		action?: (value: number)=>void
		sensitiveBind?: string
		experimental?: boolean
		noResetButton?: boolean
		onCreated?: (row: Adw.SpinRow)=>void
	}
}

export function ExpanderRow({
	parent,
	title,
	subtitle,
	expanded,
	experimental,
	onCreated,
}: ExpanderRow.Options, children?: any[]): Adw.ExpanderRow {
	const row = new Adw.ExpanderRow({
		title: title ?? null,
		subtitle: subtitle ?? null
	})
	if (parent) {
		parent.add(row)
	}
	addChildren(row, "add_row", children)
	if (expanded === false || expanded === true) {
		row.expanded = expanded
	}
	if (experimental) ExperimentalIcon.prependExperimentalIcon(row.child)
	if (onCreated) onCreated(row)
	return row
}
export namespace ExpanderRow {
	export interface Options {
		parent?: any
		title?: string
		subtitle?: string
		expanded?: boolean
		experimental?: boolean
		onCreated?: (row: Adw.ExpanderRow)=>void
	}
}

export function Dropdown({
	settings,
	items,
	bind,
	parent,
	value,
	title,
	subtitle,
	action,
	sensitiveBind,
	experimental,
	noResetButton,
	onCreated,
}: Dropdown.Options) {
	if (bind) value ??= settings.get_string(bind)

	let filterModeModel = new Gio.ListStore({ item_type: Dropdown.Items as any })
	for (const item of items) {
		filterModeModel.append(new (Dropdown.Items as any)(item.name, item.value))
	}

	let selected = null
	for (let i = 0; i < filterModeModel.get_n_items(); i++) {
		if ((filterModeModel.get_item(i) as any).value === value) {
			selected = i
			break
		}
	}
	if (selected === null) selected = -1

	let row = new Adw.ComboRow({
		title: title ?? "",
		subtitle: subtitle ?? null,
		model: filterModeModel,
		expression: new (Gtk.PropertyExpression as any)(Dropdown.Items, null, 'name'),
		selected: selected
	})

	if (parent) {
		parent.add(row)
	}

	if (bind) {
		if (!noResetButton) ResetButton.pushResetButton(row, { settings, bind })
	}

	if (bind || action) row.connect('notify::selected', () => {
		if (bind) {
			settings.set_string(bind, (row.selectedItem as any).value)
		}
		if (action) {
			action((row.selectedItem as any).value)
		}
	})
		
	if (sensitiveBind) {
		settings.bind(
			sensitiveBind,
			row, 'sensitive',
			Gio.SettingsBindFlags.DEFAULT
		)
		row.sensitive = settings.get_boolean(sensitiveBind)
	}
	if (experimental) ExperimentalIcon.prependExperimentalIcon(row.child)
	if (onCreated) onCreated(row)

	return row
}
export namespace Dropdown {
	export interface Options {
		settings?: Gio.Settings
		items: { name: string, value: string }[]
		bind?: string
		parent?: any
		value?: string
		title?: string
		subtitle?: string
		sensitiveBind?: string
		action?: (value: string)=>void
		experimental?: boolean
		noResetButton?: boolean
		onCreated?: (row: Adw.ComboRow)=>void
	}
	export const Items = GObject.registerClass({
		Properties: {
			'name': GObject.ParamSpec.string(
				'name', 'name', 'name',
				GObject.ParamFlags.READWRITE,
				null),
			'value': GObject.ParamSpec.string(
				'value', 'value', 'value',
				GObject.ParamFlags.READWRITE,
				null),
		},
	}, class DropdownItems extends GObject.Object {
		_init(name, value) {
			super._init({ name, value })
		}
	})
}
