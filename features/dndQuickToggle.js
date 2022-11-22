const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const featureReloader = Me.imports.libs.featureReloader
const { QuickSettings } = Me.imports.libs.gnome
const { Indicator } = Me.imports.libs.dndQuickToogleHandler
const { DateMenu } = Me.imports.libs.gnome


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
        
        //remove DND button from datemenu
        this.datemenu_dnd = DateMenu.last_child.last_child
        DateMenu.last_child.remove_actor(this.datemenu_dnd);
        
    }

    unload() {
        // disable feature reloader
        featureReloader.disable(this)
        //put back the button to the datemenu
	DateMenu.last_child.add_child(this.datemenu_dnd);
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

