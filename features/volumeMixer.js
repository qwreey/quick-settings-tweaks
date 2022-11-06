const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const featureReloader = Me.imports.libs.featureReloader
const { VolumeMixer } = Me.imports.libs.volumeMixerHandler
const { QuickSettingsGrid } = Me.imports.libs.gnome
const { addChildWithIndex } = Me.imports.libs.utility

var volumeMixerFeature = class {
    constructor(settings) {
        this.settings = settings
    }

    load() {
        let settings = this.settings

        // setup reloader
        featureReloader.enableWithSettingKeys(this,[
            "volume-mixer-enabled",
            "volume-mixer-position",
            "volume-mixer-filtered-apps",
            "volume-mixer-show-description",
            "volume-mixer-show-icon",
            "volume-mixer-filter-mode"
        ])

        // check is feature enabled
        if (!this.settings.get_boolean("volume-mixer-enabled")) return

        // Make volume mixer
        this.volumeMixer = new VolumeMixer({
            'volume-mixer-filtered-apps': settings.get_strv("volume-mixer-filtered-apps"),
            'volume-mixer-filter-mode': settings.get_string("volume-mixer-filter-mode"),
            'volume-mixer-show-description': settings.get_boolean("volume-mixer-show-description"),
            'volume-mixer-show-icon': settings.get_boolean("volume-mixer-show-icon")
        })

        // Find Input slider index
        let inputSliderIndex
        let gridChildren = QuickSettingsGrid.get_children()
        for (let index = 0; index<gridChildren.length; index++) {
            if (gridChildren[index]?.constructor?.name == "InputStreamSlider") {
                inputSliderIndex = index
            }
        }

        // Insert volume mixer into Quick Settings
        let position = settings.get_string("volume-mixer-position")
        switch (position) {
            case "top": addChildWithIndex(QuickSettingsGrid,this.volumeMixer.actor,inputSliderIndex)
            case "bottom": QuickSettingsGrid.add_child(this.volumeMixer.actor)
        }

        // Allow volume mixer taking 2 space
        QuickSettingsGrid.layout_manager.child_set_property(
            QuickSettingsGrid, this.volumeMixer.actor, 'column-span', 2
        )
    }

    unload() {
        // disable feature reloader
        featureReloader.disable(this)
        this.volumeMixer.destroy()
    }
}
