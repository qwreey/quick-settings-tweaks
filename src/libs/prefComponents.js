
import Adw from "gi://Adw"
import Gio from "gi://Gio"
import Gtk from "gi://Gtk"
import GObject from "gi://GObject"

export const baseGTypeName = "qwreey.quick-settings-tweaks.prefs."

export function makeRow(options={parent: null,title: null, subtitle: null,uri: null, sensitiveBind: null}) {
    const row = new Adw.ActionRow({
        title: options.title,
        subtitle: options.subtitle || null
    })
    if (options.parent) {
        options.parent.add(row)
    }
    if (options.uri) {
        // row.uri = options.uri
        row.set_child(new Gtk.LinkButton({
            uri: options.uri,
            visited: true, // for disable coloring
            child: new Adw.ActionRow({
                title: options.title,
                subtitle: options.subtitle || null
            })
        }))
    }
    if (options.suffix) {
        row.add_suffix(options.suffix)
    }
    if (options.prefix) {
        row.add_prefix(options.prefix)
    }
    if (options.sensitiveBind) {
        options.sensitiveBind[0].bind(
            options.sensitiveBind[1],
            row,'sensitive',
            Gio.SettingsBindFlags.DEFAULT
        )
        row.sensitive = options.sensitiveBind[0].get_boolean(options.sensitiveBind[1])
    }
    return row
}

export function makeSwitch(options={bind: null,parent: null,value: false,title: "default",subtitle: null,action: null,sensitiveBind:null}) {
    const row = new Adw.SwitchRow({
        title: options.title,
        subtitle: options.subtitle || null,
        active: options.value
    })

    if (options.action) {
        row.connect("notify::active",()=>{
            options.action(row.get_active())
        })
    }

    if (options.parent) {
        options.parent.add(row)
    }

    if (options.bind) {
        options.bind[0].bind(
            options.bind[1],
            row,'active',
            Gio.SettingsBindFlags.DEFAULT
        )
    }

    if (options.sensitiveBind) {
        options.sensitiveBind[0].bind(
            options.sensitiveBind[1],
            row,'sensitive',
            Gio.SettingsBindFlags.DEFAULT
        )
        row.sensitive = options.sensitiveBind[0].get_boolean(options.sensitiveBind[1])
    }

    return row
}

export function makeAdjustment(options={
    max: 100,
    stepIncrement: 1,
    pageIncrement: 10,
    bind: null,
    parent: null,
    value: 1,
    title: "default",
    subtitle: null,
    action: null,
    sensitiveBind: null,
}) {
    const row = new Adw.SpinRow({
        title: options.title,
        subtitle: options.subtitle || null,
        adjustment: new Gtk.Adjustment({
            upper: options.max,
            stepIncrement: options.stepIncrement || 1,
            pageIncrement: options.pageIncrement || 10
        }),
    })

    if (options.action) {
        row.connect("notify::value",()=>{
            options.action(row.get_value())
        })
    }

    if (options.parent) {
        options.parent.add(row)
    }

    if (options.bind) {
        options.bind[0].bind(
            options.bind[1],
            row,'value',
            Gio.SettingsBindFlags.DEFAULT
        )
    }

    if (options.sensitiveBind) {
        options.sensitiveBind[0].bind(
            options.sensitiveBind[1],
            row,'sensitive',
            Gio.SettingsBindFlags.DEFAULT
        )
        row.sensitive = options.sensitiveBind[0].get_boolean(options.sensitiveBind[1])
    }

    return row
}

export function makeExpander(options={parent: null,title: null, subtitle: null, children: null, expanded: null}) {
    const row = new Adw.ExpanderRow({
        title: options.title,
        subtitle: options.subtitle || null
    })
    if (options.parent) {
        options.parent.add(row)
    }
    if (options.children) {
        for (const child of options.children) {
            row.add_row(child)
        }
    }
    if (options.expanded === false || options.expanded === true) {
        row.expanded = options.expanded
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
export function makeDropdown(options={
    items:[{name:"",value:""}],
    bind: null,
    parent: null,
    value: false,
    title: "default",
    subtitle: null,
    action: null,
    type: null,
    sensitiveBind: null,
}) {
    let filterModeModel = new Gio.ListStore({ item_type: DropdownItems })
    for (const item of options.items) {
        filterModeModel.append(new DropdownItems(item.name, item.value))
    }

    let selected = null
    for (let i = 0; i < filterModeModel.get_n_items(); i++) {
        if (filterModeModel.get_item(i).value === options.value) {
            selected = i
            break
        }
    }
    if (selected === null) selected = -1

    let filterModeRow = new Adw.ComboRow({
        title: options.title,
        subtitle: options.subtitle || null,
        model: filterModeModel,
        expression: new Gtk.PropertyExpression(DropdownItems, null, 'name'),
        selected: selected
    })
    if (options.parent) {
        options.parent.add(filterModeRow)
    }

    if (options.bind) {
        filterModeRow.connect('notify::selected', () => {
            options.bind[0]["set_"+options.type](options.bind[1], filterModeRow.selectedItem.value)
        })
    }

    if (options.action) {
        filterModeRow.connect('notify::selected', () => {
            action(filterModeRow.selectedItem.value)
        })
    }

    if (options.sensitiveBind) {
        options.sensitiveBind[0].bind(
            options.sensitiveBind[1],
            filterModeRow,'sensitive',
            Gio.SettingsBindFlags.DEFAULT
        )
        filterModeRow.sensitive = options.sensitiveBind[0].get_boolean(options.sensitiveBind[1])
    }

    return filterModeRow
}
