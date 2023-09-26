// forked from https://github.com/qwreey75/gnome-quick-settings-button-remover

import { QuickSettingsGrid } from "../libs/gnome.js"

export class ButtonRemoverFeature {
    constructor() {
        this.removedItems = []
        this.visibleListeners = []
        this.systemHiddenItems = [];
    }
    onMenuItemAdded() {
        this._unapply()
        this._apply(this.userRemovedItems)
    }
    _apply(removedItems) {
        this.systemHiddenItems = [];

        for (const item of QuickSettingsGrid.get_children()) {
            let name = item.constructor.name.toString()
            if (!item.visible) {
                this.systemHiddenItems.push(item);
            }
            if (name && removedItems.includes(name)) {
                item.hide()
                this.removedItems.push(item)
                this.visibleListeners.push([item,
                    item.connect("show", () => {
                        const index = this.systemHiddenItems.indexOf(item);
                        if (index > -1) {
                            this.systemHiddenItems.splice(index, 1);
                        }
                        this._unapply();
                        this._apply(removedItems);
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
            if (!this.systemHiddenItems.includes(item)) item.show();
        }
        this.removedItems = []
        this.systemHiddenItems = [];
    }
    load() {
            const listButtons = []
            for (const item of QuickSettingsGrid.get_children()){
                if (item === QuickSettingsGrid.layout_manager._overlay) continue;
                listButtons.push({
                    name: item.constructor?.name,
                    title: item.title || null,
                    visible: item.visible
                })
            }
            this.settings.set_string("list-buttons", JSON.stringify(listButtons))

        let items = this.userRemovedItems = this.settings.get_strv("user-removed-buttons")
        if (!items) {
            items = this.userRemovedItems = []
            this.settings.set_strv("user-removed-buttons", items)
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
