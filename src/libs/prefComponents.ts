
import Adw from "gi://Adw"
import Gio from "gi://Gio"
import Gtk from "gi://Gtk"
import GObject from "gi://GObject"

export const baseGTypeName = "quick-settings-tweaks_prefs_"

function addChildren(target: any, funcName: string, children?: any[]) {
	if (!children) return
	for (const item of children) {
		if (!item) continue
		target[funcName](item)
	}
}

export type GroupOptions = Partial<Adw.PreferencesGroup.ConstructorProps & {
	parent?: any
}>
export function Group(options: GroupOptions, children?: any[]): Adw.PreferencesGroup {
	options.title ??= ""
	const { parent } = options
	delete options.parent
	const target = new Adw.PreferencesGroup(options)
	addChildren(target, "add", children)
	if (parent) parent.add(target)
	return target
}

export interface RowOptions {
	parent?: any
	title?: string
	subtitle?: string
	uri?: string
	settings?: Gio.Settings
	sensitiveBind?: string
	suffix?: Gtk.Widget
	prefix?: Gtk.Widget
}
export function Row({
	settings,
	parent,
	title,
	subtitle,
	uri,
	sensitiveBind,
	suffix,
	prefix,
}: RowOptions): Adw.ActionRow {
	const row = new Adw.ActionRow({
		title: title ?? null,
		subtitle: subtitle ?? null
	})
	if (parent) {
		parent.add(row)
	}
	if (uri) {
		// row.uri = options.uri
		row.set_child(new Gtk.LinkButton({
			uri,
			visited: true, // for disable coloring
			child: new Adw.ActionRow({
				title: title ?? null,
				subtitle: subtitle ?? null
			})
		}))
	}
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
	return row
}

export interface SwitchOptions {
	settings?: Gio.Settings
	value?: boolean,
	bind?: string,
	parent?: any,
	title?: string,
	subtitle?: string,
	action?: (value: boolean)=>void,
	sensitiveBind?: string,
}
export function Switch({
	bind,
	parent,
	value,
	title,
	subtitle,
	action,
	sensitiveBind,
	settings,
}: SwitchOptions): Adw.SwitchRow {
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
	}

	if (sensitiveBind) {
		settings.bind(
			sensitiveBind,
			row, 'sensitive',
			Gio.SettingsBindFlags.DEFAULT
		)
		row.sensitive = settings.get_boolean(sensitiveBind)
	}

	return row
}

export interface AdjustmentOptions {
	settings?: Gio.Settings
	max?: number,
	min?: number,
	stepIncrement?: number,
	pageIncrement?: number,
	bind?: string,
	parent?: any,
	value?: number,
	title?: string,
	subtitle?: string,
	action?: (value: number)=>void,
	sensitiveBind?: string,
}
export function Adjustment({
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
}: AdjustmentOptions): Adw.SpinRow {
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
	}

	if (sensitiveBind) {
		settings.bind(
			sensitiveBind,
			row, 'sensitive',
			Gio.SettingsBindFlags.DEFAULT
		)
		row.sensitive = settings.get_boolean(sensitiveBind)
	}

	return row
}

export interface ExpanderOptions {
	parent?: any
	title?: string
	subtitle?: string
	expanded?: boolean
}
export function Expander({
	parent,
	title,
	subtitle,
	expanded,
}: ExpanderOptions, children?: any[]): Adw.ExpanderRow {
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
	return row
}

export const DropdownItems = GObject.registerClass({
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
export interface DropdownOptions {
	settings?: Gio.Settings
	items: [{ name: string, value: string }]
	bind?: string
	parent?: any
	value?: string
	title?: string,
	subtitle?: string,
	sensitiveBind?: string,
	action?: (value: string)=>void,
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
}: DropdownOptions) {
	if (bind) value ??= settings.get_string(bind)

	let filterModeModel = new Gio.ListStore({ item_type: DropdownItems as any })
	for (const item of items) {
		filterModeModel.append(new (DropdownItems as any)(item.name, item.value))
	}

	let selected = null
	for (let i = 0; i < filterModeModel.get_n_items(); i++) {
		if ((filterModeModel.get_item(i) as any).value === value) {
			selected = i
			break
		}
	}
	if (selected === null) selected = -1

	let filterModeRow = new Adw.ComboRow({
		title: title ?? "",
		subtitle: subtitle ?? null,
		model: filterModeModel,
		expression: new (Gtk.PropertyExpression as any)(DropdownItems, null, 'name'),
		selected: selected
	})
	if (parent) {
		parent.add(filterModeRow)
	}

	if (bind || action) filterModeRow.connect('notify::selected', () => {
		if (bind) {
			settings.set_string(bind, (filterModeRow.selectedItem as any).value)
		}
		if (action) {
			action((filterModeRow.selectedItem as any).value)
		}
	})
		
	if (sensitiveBind) {
		settings.bind(
			sensitiveBind,
			filterModeRow, 'sensitive',
			Gio.SettingsBindFlags.DEFAULT
		)
		filterModeRow.sensitive = settings.get_boolean(sensitiveBind)
	}

	return filterModeRow
}
