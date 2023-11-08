import Adw from "gi://Adw"
import GObject from "gi://GObject"
import Gtk from "gi://Gtk"

import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js"

import {
    baseGTypeName,
    makeRow,
    makeExpander,
} from "../libs/prefComponents.js"
import contributors from "../contributors/data.js"

export const aboutPage = GObject.registerClass({
    GTypeName: baseGTypeName+'aboutPage',
}, class aboutPage extends Adw.PreferencesPage {
    constructor(settings, metadata) {
        // group config
        super({
            name: 'about',
            title: _('About'),
            iconName: 'dialog-information-symbolic'
        })

        // logo
        const logo = new Adw.PreferencesGroup({
            title: "",
        })
        let logoBox = new Gtk.Box({
            baseline_position: Gtk.BaselinePosition.CENTER,
            // hexpand: false,
            // vexpand: false,
            // homogeneous: true,
            orientation: Gtk.Orientation.VERTICAL,
        })
        const logoImage = new Gtk.Image({
            margin_bottom: 20,
            margin_top: 10,
            icon_name: "project-icon",
            pixel_size: 100,
        })
        logoBox.append(logoImage)
        const logoText = new Gtk.Label({
            label: "Quick Setting Tweaker",
            css_classes: ["title-2"],
            vexpand: true,
            valign: Gtk.Align.FILL,
        })
        logoBox.append(logoText)
        logo.add(logoBox)
        this.add(logo)

        // information
        const info = new Adw.PreferencesGroup({
            title: "",
        })
        makeRow({
            parent: info,
            title: _("This extension is distributed with license GPL 3+"),
            subtitle: _("excludes Third-party. Third party codes follow their license"),
        })
        makeRow({
            parent: info,
            title: _("Extension Version"),
            suffix: new Gtk.Label({
                label: metadata.version?.toString() || _("Unknown (Built from source)")
            }),
        })
        this.add(info)

        // links
        const links = new Adw.PreferencesGroup({
            title: _('Links')
        })
        this.add(links)
        makeRow({
            uri: "https://patreon.com/user?u=44216831",
            parent: links,
            title: _("Donate via patreon"),
            subtitle: _("Support development!"),
        })
        makeRow({
            uri: "https://extensions.gnome.org/extension/5446/quick-settings-tweaker/",
            parent: links,
            title: "Gnome Extension",
            subtitle: _("Rate and comment the extension!"),
        })
        makeRow({
            uri: "https://github.com/qwreey75/quick-settings-tweaks",
            parent: links,
            title: _("Github Repository"),
            subtitle: _("Add Star on Repository is helping me a lot!\nPlease, if you found bug from this extension, you can make issue to make me know that!\nOr, you can create PR with wonderful features!"),
        })
        makeRow({
            uri: "https://weblate.paring.moe/projects/gs-quick-settings-tweaks/",
            parent: links,
            title: "Webslate",
            subtitle: _("Add translation to this extension!"),
        })

        // contributor
        const contributorGroup = new Adw.PreferencesGroup({
            title: _('Contributor'),
            description: _("The creators of this extension"),
        })
        for (const items of contributors) {
            let box = new Gtk.Box({
                baseline_position: Gtk.BaselinePosition.CENTER,
                // hexpand: false,
                // vexpand: false,
                homogeneous: true,
                orientation: Gtk.Orientation.HORIZONTAL,
            })
            makeRow({
                parent: contributorGroup,
                title: _("This extension is distributed with license GPL 3+"),
                subtitle: _("excludes Third-party. Third party codes follow their license"),
            }).set_child(box)
            for (const item of items) {
                let itemBox = new Gtk.Box({
                    baseline_position: Gtk.BaselinePosition.CENTER,
                    orientation: Gtk.Orientation.VERTICAL,
                })
                const itemImage = new Gtk.Image({
                    margin_bottom: 2,
                    margin_top: 10,
                    icon_name: item.image,
                    pixel_size: 38,
                })
                itemBox.append(itemImage)
                const nameText = new Gtk.Label({
                    label: '<span size="small">'+item.name+'</span>',
                    useMarkup: true,
                    hexpand: true,
                })
                itemBox.append(nameText)
                const labelText = new Gtk.Label({
                    label: '<span size="small">'+item.label+'</span>',
                    useMarkup: true,
                    hexpand: true,
                    opacity: 0.7,
                    margin_bottom: 8,
                })
                itemBox.append(labelText)
                box.append(itemBox)
            }
            // contributorRow.add(box)
        }
        this.add(contributorGroup)

        // third party LICENSE
        const thirdLICENSE = new Adw.PreferencesGroup({
            title: _('Third party LICENSE'),
            description: _('LICENSE OF CODES WHICH USED ON THIS EXTENSION')
        })
        this.add(thirdLICENSE)
        makeExpander({
            uri: "https://github.com/mymindstorm/gnome-volume-mixer/blob/master/LICENSE",
            parent: thirdLICENSE,
            title: "gnome-volume-mixer",
            subtitle: "https://github.com/mymindstorm/gnome-volume-mixer/blob/master/LICENSE",
            expanded: false,
            children: [
                makeRow({
                    title: "Affected on files",
                    subtitle: `prefPages/volumeMixer.js
libs/volumeMixerHandler.js
features/volumeMixer.js
schemas/org.gnome.shell.extensions.quick-settings-tweaks.gschema.xml`,
                }),
                makeRow({
                    title: "License",
                    subtitle: `MIT License

Copyright (c) 2020-2022 Brendan Early

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
                })
            ],
        })
    }
})
