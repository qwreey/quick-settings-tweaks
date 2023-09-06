import Adw from "gi://Adw"
import Gtk from "gi://Gtk"
import GObject from "gi://GObject"

import {
    baseGTypeName,
    makeRow,
    makeSwitch
} from "../libs/prefComponents.js"

export var quickTogglesPage = GObject.registerClass({
    GTypeName: baseGTypeName+'quickTogglesPage',
}, class quickTogglesPage extends Adw.PreferencesPage {
    constructor(settings) {
        // group config
        super({
            name: 'quickToggles',
            title: 'Quick Toggles',
            iconName: 'org.gnome.Settings-symbolic'
        })

        const newTogglesGroup = new Adw.PreferencesGroup({
            title: 'Add more buttons',
            description: 'Turn on the buttons you want to add on Quick Settings'
        })
        makeSwitch({
            parent: newTogglesGroup,
            title: "DND Quick Toggle",
            subtitle: "Turn on to make the DND quick toggle visible on the Quick Settings panel",
            value: settings.get_boolean("add-dnd-quick-toggle-enabled"),
            bind: [settings, "add-dnd-quick-toggle-enabled"]
        })
        makeSwitch({
            parent: newTogglesGroup,
            title: "Unsafe Mode Quick Toggle",
            subtitle: "Turn on to make the unsafe quick toggle visible on the Quick Settings panel",
            value: settings.get_boolean("add-unsafe-quick-toggle-enabled"),
            bind: [settings, "add-unsafe-quick-toggle-enabled"]
        })
        this.add(newTogglesGroup)

        // description / enable
        const descriptionGroup = new Adw.PreferencesGroup({
            title: 'Buttons to remove',
            description: 'Turn on the buttons you want to remove from Quick Settings'
        })
        makeRow({
            parent: descriptionGroup,
            title: "Remove chosen buttons from quick panel",
            subtitle: "Forked from my extension https://github.com/qwreey75/gnome-quick-settings-button-remover"
        })
        makeRow({
            parent: descriptionGroup,
            title: "This feature is unstable sometime",
            subtitle: "When lock/unlock with gnome-screensaver, unexpected behavior occurs\nPlease do not report issue about known issue, Almost duplicated\nKnown issue:\n  button doesn't remove after lockscreen\n  modal get bigger after lockscreen"
        })
        makeRow({
            parent: descriptionGroup,
            title: "Please turn off if some bug occurred"
        })
        this.add(descriptionGroup)

        // general
        const removeGroup = new Adw.PreferencesGroup()
        this.add(removeGroup)

        let listButtons = JSON.parse(settings.get_string("list-buttons"))
        let removedButtons = settings.get_strv("user-removed-buttons")
        for (let button of listButtons) {
            const row = new Adw.ActionRow({
                title: (button.name || "Unknown") + (button.visible ? "" : " (invisible by system)"),
                subtitle: button.label
            })
            removeGroup.add(row);
    
            const toggle = new Gtk.Switch({
                active: removedButtons.includes(button.name),
                valign: Gtk.Align.CENTER,
            });
    
            toggle.connect("notify::active",()=>{
                if (toggle.get_active()) {
                    removedButtons.push(button.name)
                } else {
                    while (true) {
                        let index = removedButtons.indexOf(button.name)
                        if (index != -1) {
                            removedButtons.splice(index,1)
                        } else break
                    }
                }
                settings.set_strv("user-removed-buttons",removedButtons)
            })
    
            row.add_suffix(toggle);
            row.activatable_widget = toggle;
        }
    }
})
