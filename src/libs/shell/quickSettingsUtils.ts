import {
	QuickMenuToggle,
	QuickToggle,
	type QuickSettingsMenu,
} from "resource:///org/gnome/shell/ui/quickSettings.js"
import { type PopupMenuBase, PopupSeparatorMenuItem } from "resource:///org/gnome/shell/ui/popupMenu.js"
import { Global } from "../../global.js"
import Maid from "../shared/maid.js"

export abstract class QuickSettingsTrackerBase<T> {
	appliedChild: Map<T, Maid>
	gridConnection: number
	load(): void {
		this.appliedChild = new Map()
		this.gridConnection = Global.QuickSettingsGrid.connect("child-added", (_: any, child: any)=>{
			const ok = this.catchChild(child)
			if (ok && this.onUpdate) this.onUpdate()
		})
		for (const child of Global.QuickSettingsGrid.get_children()) {
			this.catchChild(child)
		}
		if (this.onUpdate) this.onUpdate()
	}
	unload(): void {
		for (const maid of this.appliedChild.values()) {
			maid.destroy()
		}
		Global.QuickSettingsGrid.disconnect(this.gridConnection)
		this.gridConnection = null
		this.appliedChild = null
	}
	get items(): T[] {
		if (!this.appliedChild) return []
		return [...this.appliedChild.keys()]
	}
	protected abstract catchChild(child: any): boolean
	onUpdate: ()=>void
}

export class QuickSettingsMenuTracker extends QuickSettingsTrackerBase<QuickSettingsMenu> {
	onOpen: (maid: Maid, menu: QuickSettingsMenu, isOpen: boolean)=>void
	onMenuCreated: (maid: Maid, menu: QuickSettingsMenu)=>void
	protected override catchChild(child: any): boolean {
		const menu = child.menu
		if (!menu) return false
		if (this.appliedChild.has(menu)) return false

		const menuMaid = new Maid()
		menuMaid.functionJob(()=>{
			this.appliedChild.delete(menu)
		})
		menuMaid.connectJob(menu, "open-state-changed", (_: any, isOpen: boolean) => {
			if (this.onOpen) this.onOpen(menuMaid, menu, isOpen)
		})
		menuMaid.connectJob(menu, "destroy", ()=>{
			menuMaid.destroy()
		})
		if (this.onMenuCreated) this.onMenuCreated(menuMaid, menu)
		this.appliedChild.set(menu, menuMaid)
		return true
	}
	get menus() {
		if (!this.appliedChild) return []
		return [...this.appliedChild.keys()]
	}
}

export class QuickSettingsToggleTracker extends QuickSettingsTrackerBase<QuickToggle|QuickMenuToggle> {
	onToggleCreated: (maid: Maid, toggle: QuickToggle|QuickMenuToggle)=>void
	protected override catchChild(child: any): boolean {
		if (
			!(child instanceof QuickToggle)
			&& !(child instanceof QuickMenuToggle)
		) return false
		if (this.appliedChild.has(child)) return false

		const toggleMaid = new Maid()
		toggleMaid.functionJob(()=>{
			this.appliedChild.delete(child)
		})
		toggleMaid.connectJob(child, "destroy", ()=>{
			toggleMaid.destroy()
		})
		if (this.onToggleCreated) this.onToggleCreated(toggleMaid, child)
		this.appliedChild.set(child, toggleMaid)
		return true
	}
}

export function updateMenuSeparators(menu: PopupMenuBase) {
	for (const item of (menu as any)._getMenuItems()) {
		if (!(item instanceof PopupSeparatorMenuItem)) {
			continue
		}
		(menu as any)._updateSeparatorVisibility(item)
	}
}
