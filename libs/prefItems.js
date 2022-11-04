
const { Adw, Gio, Gtk } = imports.gi
var baseGTypeName = "qwreey.quick-settings-tweaks.prefs."

function makeRow(options={parent: null,title: null, subtitle: null}) {
    const row = new Adw.ActionRow({
        title: options.title,
        subtitle: options.subtitle
    })
    if (options.parent) {
        options.parent.add(row)
    }
    return row
}

function makeSwitch(options={bind: null,parent: null,value: false,title: "default",subtitle: null,action: null}) {
    const row = new Adw.ActionRow({
        title: options.title,
        subtitle: options.subtitle
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
