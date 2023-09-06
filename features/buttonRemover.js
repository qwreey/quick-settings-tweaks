// forked from https://github.com/qwreey75/gnome-quick-settings-button-remover

import { QuickSettingsGrid } from "../libs/gnome.js"

export var buttonRemoverFeature = class {
    constructor() {
        this.removedItems = []
        this.visibleListeners = []
    }
    onMenuItemAdded() {
        this._unapply()
        this._apply(this.userRemovedItems)
    }
    _apply(removedItems) {
        for (const item of QuickSettingsGrid.get_children()) {
            let name = item.constructor.name.toString()
            if (name && removedItems.includes(name) && name!="Clutter_Actor") {
                item.hide()
                this.removedItems.push(item)
                this.visibleListeners.push([item,
                    item.connect("show",()=>{
                        this._unapply(); this._apply(removedItems)
                    })
                ])
            }
        }
    }
    _unapply() {
        for (const connection of this.visibleListeners) {
            connection[0].disconnect(connection[1])
        }
        this.visibleListeners = []
        for (const item of this.removedItems) {
            item.show()
        }
        this.removedItems = []
    }
    load() {
        {
            let listButtons = []
            for (const item of QuickSettingsGrid.get_children()){
                listButtons.push({
                    name: item.constructor?.name,
                    label: item.label || null,
                    visible: item.visible
                })
            }
            this.settings.set_string("list-buttons",JSON.stringify(listButtons))
        }

        let items = this.userRemovedItems = this.settings.get_strv("user-removed-buttons")
        if (!items) {
            items = this.userRemovedItems = []
            this.settings.set_strv("user-removed-buttons",items)
        }

        this._apply(items)

        this._removedItemsConnection =
        this.settings.connect('changed::user-removed-buttons', (settings, key) => {
            this._unapply()
            this._apply(this.userRemovedItems = this.settings.get_strv("user-removed-buttons"))
        })
    }
    unload() {
        this._unapply()
        this.settings.disconnect(this._removedItemsConnection)
    }
}
