const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const featureReloader = Me.imports.libs.featureReloader
const { QuickSettings } = Me.imports.libs.gnome
const { Indicator } = Me.imports.libs.dndQuickToogleHandler

var dndQuickToggleFeature = class {
    load() {
        // setup reloader
        featureReloader.enableWithSettingKeys(this,[
            "add-dnd-quick-toggle-enabled"
        ])

        // check is feature enabled
        if (!this.settings.get_boolean("add-dnd-quick-toggle-enabled")) return

        // Add DND Quick Toggle
        this.dndToggle = new Indicator()
        QuickSettings._indicators.add_child(this.dndToggle)
        QuickSettings._addItems(this.dndToggle.quickSettingsItems)
    }

    unload() {
        // disable feature reloader
        featureReloader.disable(this)

        // Remove DND Quick Toggle
        if (this.dndToggle) {
            const dndQSItems = this.dndToggle.quickSettingsItems[0]
            dndQSItems.get_parent().remove_child(dndQSItems)
            this.dndToggle.get_parent().remove_child(this.dndToggle)
            this.dndToggle.destroy()
            this.dndToggle = null
        }
    }
}

