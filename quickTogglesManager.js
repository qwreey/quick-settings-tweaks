// forked from https://github.com/qwreey75/gnome-quick-settings-button-remover

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

var QuickTogglesManager = class QuickTogglesManager {
    constructor() {
        this.removedItems = []
        this.quickSettingsBox = imports.ui.main.panel.statusArea.quickSettings.menu.box.first_child
    }
    _load(items) {
        let boxItems = this.quickSettingsBox.get_children()
        for (let index=0; index<boxItems.length; index++) {
            let item = boxItems[index]
            let name = item.constructor.name.toString()
            if (name && item.visible && items.includes(name)) {
                item.visible = false
                this.removedItems.push(item)
            }
        }
    }
    _unload() {
        for (let index=0; index<this.removedItems.length; index++) {
            this.removedItems[index].visible = true
        }
        this.removedItems = []
    }
    enable(quickSettingsBox) {
        if (quickSettingsBox) this.quickSettingsBox = quickSettingsBox
        this.settings = ExtensionUtils.getSettings(Me.metadata['settings-schema'])

        // Add DND Quick Toggle
        const qs = imports.ui.main.panel.statusArea.quickSettings;
        this._dndToggle = new Me.imports.quickToggles.DND.Indicator();
        qs._indicators.add_child(this._dndToggle);
        qs._addItems(this._dndToggle.quickSettingsItems);

        {
            let allButtons = []
            let buttonsLabel = {}
            let defaultInvisibleButtons = []
            imports.ui.main.panel.statusArea.quickSettings.menu.box.first_child.get_children().forEach(item=>{
                let name = item.constructor.name
                allButtons.push(name)
                if (item.label) buttonsLabel[name] = item.label
                if (!item.visible) defaultInvisibleButtons.push(name)
            })
            this.settings.set_strv("list-buttons",allButtons)
            this.settings.set_strv("default-invisible-buttons",defaultInvisibleButtons)
            this.settings.set_string("button-labels",JSON.stringify(buttonsLabel))
        }

        let items; {
            items = this.settings.get_strv("user-removed-buttons")
            if (!items) {
                items = []
                this.settings.set_strv("user-removed-buttons",items)
            }
        }

        this._load(items)

        this._removedItemsConnection =
        this.settings.connect('changed::user-removed-buttons', (settings, key) => {
            this._unload()
            this._load(this.settings.get_strv("user-removed-buttons"))
        })
    }
    destroy() {
        this._unload()
        this.settings.disconnect(this._removedItemsConnection)
        this.settings = null

        // Remove DND Quick Toggle
        const dndQSItems = this._dndToggle.quickSettingsItems[0];
        dndQSItems.get_parent().remove_child(dndQSItems);
        this._dndToggle.get_parent().remove_child(this._dndToggle);
        this._dndToggle.destroy();
        this._dndToggle = null;
    }
}
