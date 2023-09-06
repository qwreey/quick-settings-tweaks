import Adw from "gi://Adw"
import GObject from "gi://GObject"

import {
    baseGTypeName,
    makeRow,
    makeSwitch
} from "../libs/prefComponents.js"

export var mediaControlPage = GObject.registerClass({
    GTypeName: baseGTypeName+'mediaControlPage',
}, class mediaControlPage extends Adw.PreferencesPage {
    constructor(settings) {
        // group config
        super({
            name: 'mediaControl',
            title: 'Media Controls',
            iconName: 'folder-music-symbolic'
        })

        // description / enable
        const descriptionGroup = new Adw.PreferencesGroup()
        makeRow({
            parent: descriptionGroup,
            title: "Add Media Controls widget",
            subtitle: "Reference from https://github.com/Aylur/gnome-extensions\nSource code of that is not used on this extension"
        })
        makeSwitch({
            parent: descriptionGroup,
            title: "Visible",
            subtitle: "Turn on to make the Media Control widget visible on the Quick Settings panel",
            value: settings.get_boolean("media-control-enabled"),
            bind: [settings, "media-control-enabled"]
        })
        this.add(descriptionGroup)

        // general
        const generalGroup = new Adw.PreferencesGroup({ title: "General" })
        this.add(generalGroup)
        makeSwitch({
            parent: generalGroup,
            title: "Compact Mode",
            value: settings.get_boolean("media-control-compact-mode"),
            subtitle: "Make Media Controls widget smaller\nMake it more similar in size to the notification message",
            bind: [settings, "media-control-compact-mode"]
        })
    }
})