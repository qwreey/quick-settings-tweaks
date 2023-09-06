import Adw from "gi://Adw"
import Gtk from "gi://Gtk"
import GObject from "gi://GObject"

import {
    baseGTypeName,
    makeRow,
    makeSwitch,
    makeDropdown
} from "../libs/prefComponents.js"

export var VolumeMixerAddFilterDialog = GObject.registerClass({
    GTypeName: baseGTypeName+'VolumeMixerAddFilterDialog',
}, class VolumeMixerAddFilterDialog extends Gtk.Dialog {
    appNameEntry
    filterListData

    constructor(callingWidget, filterListData) {
        super({
            use_header_bar: true,
            transient_for: callingWidget.get_root(),
            destroy_with_parent: true,
            modal: true,
            resizable: false,
            title: "Add Application to filtering"
        })

        this.filterListData = filterListData

        const addButton = this.add_button("Add", Gtk.ResponseType.OK)
        addButton.get_style_context().add_class('suggested-action')
        addButton.sensitive = false
        this.add_button("Cancel", Gtk.ResponseType.CANCEL)

        const dialogContent = this.get_content_area()
        dialogContent.margin_top = 20
        dialogContent.margin_bottom = 20
        dialogContent.margin_end = 20
        dialogContent.margin_start = 20

        const appNameLabel = new Gtk.Label({
            label: "Application name",
            halign: Gtk.Align.START,
            margin_bottom: 10
        })
        dialogContent.append(appNameLabel)

        this.appNameEntry = new Gtk.Entry()
        this.appNameEntry.connect('activate', () => {
            if (this.checkInputValid()) {
                this.response(Gtk.ResponseType.OK)
            }
        })
        dialogContent.append(this.appNameEntry)

        this.appNameEntry.connect("changed", () => {
            addButton.sensitive = this.checkInputValid()
        })
    }

    checkInputValid() {
        if (this.appNameEntry.text.length === 0) {
            return false
        } else if (this.filterListData.indexOf(this.appNameEntry.text) !== -1) {
            return false
        } else {
            return true
        }
    }
})

export var FilterMode = GObject.registerClass({
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

export var volumeMixerPage = GObject.registerClass({
    GTypeName: baseGTypeName+'volumeMixerPage',
}, class volumeMixerPage extends Adw.PreferencesPage {
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
            title: "Add volume mixer (PulseAudio, Pipewire)",
            subtitle: "Forked from https://github.com/mymindstorm/gnome-volume-mixer\nThis feature works well with both PulseAudio and Pipewire protocols"
        })
        makeSwitch({
            parent: descriptionGroup,
            title: "Visible",
            subtitle: "Turn on to make the volume mixer visible",
            value: settings.get_boolean("volume-mixer-enabled"),
            bind: [settings, "volume-mixer-enabled"]
        })
        this.add(descriptionGroup)

        // Group for general settings
        const generalGroup = new Adw.PreferencesGroup({ title: "General" })
        this.add(generalGroup)

        // move to bottom
        makeDropdown({
            parent: generalGroup,
            title: "Position",
            subtitle: "Set volume mixer position",
            value: this.settings.get_string('volume-mixer-position'),
            type: "string",
            bind: [this.settings, 'volume-mixer-position'],
            items: [
                {name: "Top (Below Output/Input slider)", value: "top"},
                {name: "Bottom", value: "bottom"}
            ]
        })
        
        // show-description
        makeSwitch({
            title: 'Show stream Description',
            subtitle: 'Show audio stream description above the slider',
            value: this.settings.get_boolean('volume-mixer-show-description'),
            parent: generalGroup,
            bind: [this.settings, 'volume-mixer-show-description']
        })

        // show-icon
        makeSwitch({
            title: 'Show stream Icon',
            subtitle: 'Show application icon in front of the slider',
            value: this.settings.get_boolean('volume-mixer-show-icon'),
            parent: generalGroup,
            bind: [this.settings, 'volume-mixer-show-icon']
        })
        
        // Application filter settings group
        const filterGroup = new Adw.PreferencesGroup({
            title: 'Application Filtering',
            description: 'Filter applications shown in the volume mixer.'
        })
        this.add(filterGroup)

        // filter-mode
        makeDropdown({
            parent: filterGroup,
            title: "Filter Mode",
            value: this.settings.get_string('volume-mixer-filter-mode'),
            type: "string",
            bind: [this.settings, 'volume-mixer-filter-mode'],
            items: [
                {name: "Blacklist", value: "block"},
                {name: "Whitelist", value: "allow"}
            ]
        })
        makeSwitch({
            parent: filterGroup,
            title: 'Using Javascript Regex',
            subtitle: 'Use Javascript RegExp for filtering app name or description',
            value: this.settings.get_boolean('volume-mixer-use-regex'),
            bind: [this.settings, 'volume-mixer-use-regex']
        })
        makeSwitch({
            parent: filterGroup,
            title: "Check Stream Description",
            subtitle: "Check Description also",
            value: this.settings.get_boolean('volume-mixer-check-description'),
            bind: [this.settings, 'volume-mixer-check-description']
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
        this.settings.set_strv("volume-mixer-filtered-apps", this.filterListData)
        this.filteredAppsGroup.remove(filterListRow)
    }

    addFilteredApp(filteredAppName) {
        this.filterListData.push(filteredAppName)
        this.settings.set_strv("volume-mixer-filtered-apps", this.filterListData)
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
