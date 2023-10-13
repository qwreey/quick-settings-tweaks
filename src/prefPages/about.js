import Adw from "gi://Adw"
import GObject from "gi://GObject"
import Gtk from "gi://Gtk"

import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js"

import { baseGTypeName, makeRow } from "../libs/prefComponents.js"

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

        // description / enable
        const info = new Adw.PreferencesGroup({
            title: _('Information')
        })
        this.add(info)
        makeRow({
            parent: info,
            title: _("This extension is distributed with license GPL 3+"),
            subtitle: _("excludes Third-party. Third party codes follow their license"),
        })
        makeRow({
            parent: info,
            title: _("Version"),
            suffix: new Gtk.Label({
                label: metadata.version?.toString() || _("Unknown (Built from source)")
            })
        })

        const links = new Adw.PreferencesGroup({
            title: _('Links')
        })
        this.add(links)
        makeRow({
            uri: "https://extensions.gnome.org/extension/5446/quick-settings-tweaker/",
            parent: links,
            title: "Gnome Extension",
            subtitle: _("Rate and comment the extension!")
        })
        makeRow({
            uri: "https://github.com/qwreey75/quick-settings-tweaks",
            parent: links,
            title: _("Github Repository"),
            subtitle: _("Add Star on Repository is helping me a lot!\nPlease, if you found bug from this extension, you can make issue to make me know that!\nOr, you can create PR with wonderful features!")
        })
        makeRow({
            parent: links,
            title: "Webslate",
            subtitle: "Working in progress . . ."
        })

        const contributor = new Adw.PreferencesGroup({
            title: _('Contributor')
        })

        const thirdLICENSE = new Adw.PreferencesGroup({
            title: _('Third party LICENSE'),
            description: _('LICENSE OF CODES WHICH USED ON THIS EXTENSION')
        })
        this.add(thirdLICENSE)
        makeRow({
            uri: "https://github.com/mymindstorm/gnome-volume-mixer/blob/master/LICENSE",
            parent: thirdLICENSE,
            title: "gnome-volume-mixer",
            subtitle: `
https://github.com/mymindstorm/gnome-volume-mixer/blob/master/LICENSE

Affected on files
prefPages/volumeMixer.js
libs/volumeMixerHandler.js
features/volumeMixer.js
schemas/org.gnome.shell.extensions.quick-settings-tweaks.gschema.xml

original source code is in here
https://github.com/mymindstorm/gnome-volume-mixer

MIT License

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
SOFTWARE.
            `
        })
    }
})
