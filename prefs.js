
const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const { VolumeMixerAddFilterDialog } = Me.imports.volumeMixerAddFilterDialog

const { Adw, Gio, Gtk, GObject } = imports.gi

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

function setFeatureEnabled(enabledFeatures,name,value) {
    if (value) {
        enabledFeatures.push(name)
    } else {
        while (true) {
            let index = enabledFeatures.indexOf(name)
            if (index != -1) {
                enabledFeatures.splice(index,1)
            } else break
        }
    }
}

var FilterMode = GObject.registerClass({
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
}, class FilterMode extends GObject.Object {
    _init(name, value) {
        super._init({ name, value })
    }
})

var volumeMixerPage = GObject.registerClass({
    GTypeName: 'volumeMixerPage',
}, class volumeMixerPage extends Adw.PreferencesPage {
    filterListData = []
    filteredAppsGroup
    settings
    addFilteredAppButtonRow

    constructor(settings) {
        // group config
        super({
            name: 'volumeMixer',
            title: 'Volume Mixer',
            iconName: 'audio-volume-high-symbolic'
        })

        this.settings = settings
        this.filterListData = this.settings.get_strv("volume-mixer-filtered-apps")

        // description / enable
        const descriptionGroup = new Adw.PreferencesGroup()
        makeRow({
            parent: descriptionGroup,
            title: "Add volume mixer (PulseAudio)",
            subtitle: "Fork from https://github.com/mymindstorm/gnome-volume-mixer\nThis feature tested on PulseAudio only, Pipewire isn't tested yet!"
        })
        let enabledFeatures = settings.get_strv("enabled-features")
        makeSwitch({
            parent: descriptionGroup,
            title: "Enabled",
            value: enabledFeatures.includes("volumeMixer"),
            subtitle: "Whether volume mixer is visible",
            action: value=>{
                enabledFeatures = settings.get_strv("enabled-features")
                setFeatureEnabled(enabledFeatures,"volumeMixer",value)
                settings.set_strv("enabled-features",enabledFeatures)
            }
        })
        this.add(descriptionGroup)

        // Group for general settings
        const generalGroup = new Adw.PreferencesGroup({ title: "General" })
        this.add(generalGroup)

        // move to bottom
        makeSwitch({
            title: 'Move to bottom',
            subtitle: 'move to bottom of quick settings modal',
            value: this.settings.get_boolean('volume-mixer-move-to-bottom'),
            parent: generalGroup,
            bind: [this.settings, 'volume-mixer-move-to-bottom']
        })

        // show-description
        makeSwitch({
            title: 'Stream Description',
            subtitle: 'Show audio stream description on slider',
            value: this.settings.get_boolean('volume-mixer-show-description'),
            parent: generalGroup,
            bind: [this.settings, 'volume-mixer-show-description']
        })

        // show-icon
        makeSwitch({
            title: 'Stream Icon',
            subtitle: 'Show application icon on slider',
            value: this.settings.get_boolean('volume-mixer-show-icon'),
            parent: generalGroup,
            bind: [this.settings, 'volume-mixer-show-icon']
        })

        // Application filter settings group
        const filterGroup = new Adw.PreferencesGroup({
            title: 'Application Filtering',
            description: 'Hide applications from the volume mixer.'
        })
        this.add(filterGroup)

        // filter-mode
        const filterModeModel = new Gio.ListStore({ item_type: FilterMode })
        filterModeModel.append(new FilterMode('Block', 'block'))
        filterModeModel.append(new FilterMode('Allow', 'allow'))

        const findCurrentFilterMode = () => {
            for (let i = 0; i < filterModeModel.get_n_items(); i++) {
                if (filterModeModel.get_item(i).value === this.settings.get_string('volume-mixer-filter-mode')) {
                    return i
                }
            }
            return -1
        }

        const filterModeRow = new Adw.ComboRow({
            title: 'Filter Mode',
            model: filterModeModel,
            expression: new Gtk.PropertyExpression(FilterMode, null, 'name'),
            selected: findCurrentFilterMode()
        })
        filterGroup.add(filterModeRow)

        filterModeRow.connect('notify::selected', () => {
            this.settings.set_string('volume-mixer-filter-mode', filterModeRow.selectedItem.value)
        })

        // group to act as spacer for filter list
        this.filteredAppsGroup = new Adw.PreferencesGroup()
        this.add(this.filteredAppsGroup)

        // List of filtered apps
        for (const filteredAppName of this.filterListData) {
            this.filteredAppsGroup.add(this.buildFilterListRow(filteredAppName))
        }

        // Add filter entry button
        this.createAddFilteredAppButtonRow()

        // TODO: modes
        // - group by application
        // - group by application but as a dropdown with streams
        // - show all streams
        // TODO: go thru github issues
        // popularity: page 26, 5th from the top
        // TODO: style
    }

    createAddFilteredAppButtonRow() {
        // I wanted to use Adw.PrefrencesRow, but you can't get the 'row-activated' signal unless it's part of a Gtk.ListBox.
        // Adw.PrefrencesGroup doesn't extend Gtk.ListBox.
        // TODO: Learn a less hacky to do this. I'm currently too new to GTK to know the best practice.
        this.addFilteredAppButtonRow = new Adw.ActionRow()
        const addIcon = Gtk.Image.new_from_icon_name("list-add")
        addIcon.height_request = 40
        this.addFilteredAppButtonRow.set_child(addIcon)
        this.filteredAppsGroup.add(this.addFilteredAppButtonRow)
        // It won't send 'activated' signal w/o this being set.
        this.addFilteredAppButtonRow.activatable_widget = addIcon
        this.addFilteredAppButtonRow.connect('activated', (callingWidget) => {
            this.showFilteredAppDialog(callingWidget, this.filterListData)
        })
    }

    buildFilterListRow(filteredAppName) {
        const filterListRow = new Adw.PreferencesRow({
            title: filteredAppName,
            activatable: false,
        })

        // Make box for custom row
        const filterListBox = new Gtk.Box({
            margin_bottom:6,
            margin_top: 6,
            margin_end: 15,
            margin_start: 15
        })

        // Add title
        const filterListLabel = Gtk.Label.new(filterListRow.title)
        filterListLabel.hexpand = true
        filterListLabel.halign = Gtk.Align.START
        filterListBox.append(filterListLabel)

        // Add remove button
        const filterListButton = new Gtk.Button({
            halign: Gtk.Align.END
        })

        // Add icon to remove button
        const filterListImage = Gtk.Image.new_from_icon_name("user-trash-symbolic")
        filterListButton.set_child(filterListImage)

        // Tie action to remove button
        filterListButton.connect("clicked", (_button) => this.removeFilteredApp(filteredAppName, filterListRow))

        filterListBox.append(filterListButton)
        filterListRow.set_child(filterListBox)

        return filterListRow
    }

    removeFilteredApp(filteredAppName, filterListRow) {
        this.filterListData.splice(this.filterListData.indexOf(filteredAppName), 1)
        this.settings.set_strv("filtered-apps", this.filterListData)
        this.filteredAppsGroup.remove(filterListRow)
    }

    addFilteredApp(filteredAppName) {
        this.filterListData.push(filteredAppName)
        this.settings.set_strv("filtered-apps", this.filterListData)
        this.filteredAppsGroup.remove(this.addFilteredAppButtonRow)
        this.filteredAppsGroup.add(this.buildFilterListRow(filteredAppName))
        this.filteredAppsGroup.add(this.addFilteredAppButtonRow)
    }

    showFilteredAppDialog(callingWidget, filterListData) {
        const dialog = new VolumeMixerAddFilterDialog(callingWidget, filterListData)
        dialog.connect('response', (_dialog, response) => {
            if (response === Gtk.ResponseType.OK) {
                this.addFilteredApp(dialog.appNameEntry.text)
            }
            dialog.close()
            dialog.destroy()
        })
        dialog.show()
    }
})

var notificationsPage = GObject.registerClass({
    GTypeName: 'notificationsPage',
}, class notificationsPage extends Adw.PreferencesPage {
    filterListData = []
    filteredAppsGroup
    settings
    addFilteredAppButtonRow

    constructor(settings) {
        // group config
        super({
            name: 'notifications',
            title: 'Notifications',
            iconName: 'user-available-symbolic'
        })

        // description / enable
        const descriptionGroup = new Adw.PreferencesGroup()
        makeRow({
            parent: descriptionGroup,
            title: "Add notifications widget",
            subtitle: "Reference from https://github.com/Aylur/gnome-extensions"
        })
        let enabledFeatures = settings.get_strv("enabled-features")
        makeSwitch({
            parent: descriptionGroup,
            title: "Enabled",
            value: enabledFeatures.includes("notifications"),
            subtitle: "Whether notification widget is visible",
            action: value=>{
                enabledFeatures = settings.get_strv("enabled-features")
                setFeatureEnabled(enabledFeatures,"notifications",value)
                settings.set_strv("enabled-features",enabledFeatures)
            }
        })
        this.add(descriptionGroup)

        // general
        const generalGroup = new Adw.PreferencesGroup({ title: "General" })
        this.add(generalGroup)
        makeSwitch({
            parent: generalGroup,
            title: "Integrated popup",
            value: settings.get_boolean("notifications-integrated"),
            subtitle: "Do not separate popup quick settings and notifications, this is better option because separated popup make many visual bugs",
            bind: [settings, "notifications-integrated"]
        })
        makeSwitch({
            parent: generalGroup,
            title: "Move to top (Not working with Integrated mode)",
            value: settings.get_boolean("notifications-move-to-top"),
            subtitle: "Move notification widget to top. quick settings panel will goes down\nThis feature will be useful if you use dash to panel",
            bind: [settings, "notifications-move-to-top"]
        })
        makeSwitch({
            parent: generalGroup,
            title: "Show dnd switch",
            value: settings.get_boolean("notifications-dnd-switch"),
            subtitle: "Add dnd button on notification widget",
            bind: [settings, "notifications-dnd-switch"]
        })

        // other
        const otherGroup = new Adw.PreferencesGroup({ title: "Other" })
        this.add(otherGroup)
        makeSwitch({
            parent: otherGroup,
            title: "Remove Date Menu Notifications",
            value: settings.get_boolean("datemenu-remove-notifications"),
            subtitle: "Hide date menu's notifications",
            bind: [settings, "datemenu-remove-notifications"]
        })
        makeSwitch({
            parent: otherGroup,
            title: "Fix Weather Widget Overflow",
            value: settings.get_boolean("datemenu-fix-weather-widget"),
            subtitle: "Fix date menu's weather widget overflow",
            bind: [settings, "datemenu-fix-weather-widget"]
        })
    }
})

var mediaControlPage = GObject.registerClass({
    GTypeName: 'mediaControlPage',
}, class mediaControlPage extends Adw.PreferencesPage {
    filterListData = []
    filteredAppsGroup
    settings
    addFilteredAppButtonRow

    constructor(settings) {
        // group config
        super({
            name: 'mediaControl',
            title: 'Media Control',
            iconName: 'folder-music-symbolic'
        })

        // description / enable
        const descriptionGroup = new Adw.PreferencesGroup()
        makeRow({
            parent: descriptionGroup,
            title: "Add media control widget",
            subtitle: "Reference from https://github.com/Aylur/gnome-extensions"
        })
        let enabledFeatures = settings.get_strv("enabled-features")
        makeSwitch({
            parent: descriptionGroup,
            title: "Enabled",
            value: enabledFeatures.includes("mediaControl"),
            subtitle: "Whether notification widget is visible",
            action: value=>{
                enabledFeatures = settings.get_strv("enabled-features")
                setFeatureEnabled(enabledFeatures,"mediaControl",value)
                settings.set_strv("enabled-features",enabledFeatures)
            }
        })
        this.add(descriptionGroup)

        // general
        const generalGroup = new Adw.PreferencesGroup({ title: "General" })
        this.add(generalGroup)
        makeSwitch({
            parent: generalGroup,
            title: "Compact Mode",
            value: settings.get_boolean("media-control-compact-mode"),
            subtitle: "Make media control widget smaller",
            bind: [settings, "media-control-compact-mode"]
        })
    }
})

var buttonRemoverPage = GObject.registerClass({
    GTypeName: 'buttonRemoverPage',
}, class notificationsPage extends Adw.PreferencesPage {
    filterListData = []
    filteredAppsGroup
    settings
    addFilteredAppButtonRow

    constructor(settings) {
        // group config
        super({
            name: 'buttonRemover',
            title: 'Button Remover',
            iconName: 'edit-clear-all-symbolic'
        })

        // description / enable
        const descriptionGroup = new Adw.PreferencesGroup()
        makeRow({
            parent: descriptionGroup,
            title: "Remove some buttons from quick panel",
            subtitle: "Forked from https://github.com/qwreey75/gnome-quick-settings-button-remover"
        })
        this.add(descriptionGroup)

        // general
        const removeGroup = new Adw.PreferencesGroup({
            title: 'Remove button',
            description: 'List of button should be removed.'
        })
        this.add(removeGroup)

        let allButtons = settings.get_strv("list-buttons") || []
        let removedButtons = settings.get_strv("user-removed-buttons") || []
        let defaultInvisibleButtons = settings.get_strv("default-invisible-buttons") || []
        let buttonsLabel
        try {
            buttonsLabel = JSON.parse(settings.get_string("button-labels"))
        } catch {}
        buttonsLabel ||= {}
    
        for (let name of allButtons) {
            const row = new Adw.ActionRow({
                title: name + (
                    defaultInvisibleButtons.includes(name) ? " (invisible by system)" : ""
                ),
                subtitle: buttonsLabel[name] || null
            })
            removeGroup.add(row);
    
            const toggle = new Gtk.Switch({
                active: removedButtons.includes(name),
                valign: Gtk.Align.CENTER,
            });
    
            toggle.connect("notify::active",()=>{
                if (toggle.get_active()) {
                    removedButtons.push(name)
                } else {
                    while (true) {
                        let index = removedButtons.indexOf(name)
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

function fillPreferencesWindow(window) {

    let settings = ExtensionUtils.getSettings(Me.metadata['settings-schema'])
    window.add(new volumeMixerPage(settings))
    window.add(new notificationsPage(settings))
    window.add(new mediaControlPage(settings))
    window.add(new buttonRemoverPage(settings))
}

function init() {
}
