
import Adw from "gi://Adw"
import Gio from "gi://Gio"
import Gtk from "gi://Gtk"
import GObject from "gi://GObject"

export var baseGTypeName = "qwreey.quick-settings-tweaks.prefs."

export function makeRow(options={parent: null,title: null, subtitle: null,uri: null}) {
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
    return row
}

export function makeSwitch(options={bind: null,parent: null,value: false,title: "default",subtitle: null,action: null}) {
    const row = new Adw.ActionRow({
        title: options.title,
        subtitle: options.subtitle || null
    })

    const toggle = new Gtk.Switch({
        active: options.value,
        valign: Gtk.Align.CENTER,
    });

    if (options.action) {
        toggle.connect("notify::active",()=>{
            options.action(toggle.get_active())
        })
    }

    row.add_suffix(toggle)
    row.activatable_widget = toggle
    row.toggle = toggle

    if (options.parent) {
        options.parent.add(row)
    }

    if (options.bind) {
        options.bind[0].bind(
            options.bind[1],
            toggle,'active',
            Gio.SettingsBindFlags.DEFAULT
        )
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
    action: null
}) {
    const row = new Adw.ActionRow({
        title: options.title,
        subtitle: options.subtitle || null
    })

    const spinButton = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
            upper: options.max,
            stepIncrement: options.stepIncrement || 1,
            pageIncrement: options.pageIncrement || 10
        }),
        valign: Gtk.Align.CENTER
    });

    if (options.action) {
        spinButton.connect("notify::value",()=>{
            options.action(toggle.get_value())
        })
    }
    row.add_suffix(spinButton)
    row.spinButton = spinButton

    if (options.parent) {
        options.parent.add(row)
    }

    if (options.bind) {
        options.bind[0].bind(
            options.bind[1],
            spinButton,'value',
            Gio.SettingsBindFlags.DEFAULT
        )
    }

    return row
}

export var DropdownItems = GObject.registerClass({
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
    type: null
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

    return filterModeRow
}
