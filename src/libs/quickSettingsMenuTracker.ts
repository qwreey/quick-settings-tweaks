import { type QuickSettingsMenu } from "resource:///org/gnome/shell/ui/quickSettings.js"
import { Global } from "../global.js"
import Maid from "../libs/maid.js"

export default class QuickSettingsMenuTracker {
    onOpen: (maid: Maid, menu: QuickSettingsMenu, isOpen: boolean)=>void
    onMenuCreated: (maid: Maid, menu: QuickSettingsMenu)=>void
    appliedChild: Map<QuickSettingsMenu, Maid>
    gridConnection: number
    catchChild(_: any, child: any): void {
        const menu = child.menu
        if (!menu) return
        if (this.appliedChild.has(menu)) return

        const menuMaid = new Maid()
        menuMaid.functionJob(()=>{
            this.appliedChild.delete(menu)
        })
        menuMaid.connectJob(menu, 'open-state-changed', (_: any, isOpen: boolean) => {
            if (this.onOpen) this.onOpen(menuMaid, menu, isOpen)
        })
        menuMaid.connectJob(menu, 'destroy', ()=>{
            menuMaid.destroy()
        })
        if (this.onMenuCreated) this.onMenuCreated(menuMaid, menu)
        this.appliedChild.set(menu, menuMaid)
    }
    get menus() {
        if (!this.appliedChild) return []
        return [...this.appliedChild.keys()]
    }
    load(): void {
        this.appliedChild = new Map()
        this.gridConnection = Global.QuickSettingsGrid.connect("child-added", this.catchChild.bind(this))
        for (const child of Global.QuickSettingsGrid.get_children()) {
            this.catchChild(null, child)
        }
    }
    unload(): void {
        for (const maid of this.appliedChild.values()) {
            maid.destroy()
        }
        Global.QuickSettingsGrid.disconnect(this.gridConnection)
        this.gridConnection = null
        this.appliedChild = null
    }
}
