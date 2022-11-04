// forked from https://github.com/qwreey75/gnome-quick-settings-button-remover

// ! NEED TO REWRITE

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const featureReloader = Me.imports.libs.featureReloader
const { QuickSettingsGrid } = Me.imports.libs.gnome

var buttonRemoverFeature = class {
    constructor(settings) {
        this.settings = settings
        this.removedItems = []
        this.visibleListeners = []
    }
    _apply(items) {
        let boxItems = QuickSettingsGrid.get_children()
        for (let index=0; index<boxItems.length; index++) {
            let item = boxItems[index]
            let name = item.constructor.name.toString()
            if (name && item.visible && items.includes(name)) {
                item.visible = false
                this.removedItems.push(item)
                this.visibleListeners.push([item,
                    item.connect("notify::visible",()=>{
                        this._unapply(); this._apply()
                    })
                ])
            }
        }
    }
    _unapply() {
        for (let index=0; index<this.removedItems.length; index++) {
            this.removedItems[index].visible = true
        }
        this.removedItems = []
    }
    load() {
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

        this._apply(items)

        this._removedItemsConnection =
        this.settings.connect('changed::user-removed-buttons', (settings, key) => {
            this._unapply()
            this._apply(this.settings.get_strv("user-removed-buttons"))
        })
    }
    unload() {
        this._unapply()
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
