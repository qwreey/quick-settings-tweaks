import {
	QuickMenuToggle,
	QuickToggle,
	SystemIndicator,
	type QuickSettingsMenu,
} from "resource:///org/gnome/shell/ui/quickSettings.js"
import { type PopupMenuBase, PopupSeparatorMenuItem } from "resource:///org/gnome/shell/ui/popupMenu.js"
import Global from "../../global.js"
import Maid from "../shared/maid.js"

export abstract class ChildrenTrackerBase<T> {
	appliedChild: Map<T, Maid>
	addConnection: number
	connectTarget: any
	protected abstract getConnectTarget(): any
	protected abstract catchChild(child: any): void
	load(): void {
		const connectTarget = this.connectTarget = this.getConnectTarget()
		this.appliedChild = new Map()
		this.addConnection = connectTarget.connect("child-added", (_: any, child: any)=>{
			this.catchChild(child)
			if (this.onUpdate) this.onUpdate()
		})
		for (const child of connectTarget.get_children()) {
			this.catchChild(child)
		}
		if (this.onUpdate) this.onUpdate()
	}
	unload(): void {
		for (const maid of this.appliedChild.values()) {
			maid.destroy()
		}
		this.connectTarget.disconnect(this.addConnection)
		this.addConnection = null
		this.appliedChild = null
	}
	get items(): T[] {
		if (!this.appliedChild) return []
		return [...this.appliedChild.keys()]
	}
	onUpdate: ()=>void
}

export class QuickSettingsMenuTracker extends ChildrenTrackerBase<QuickSettingsMenu> {
	onMenuOpen: (maid: Maid, menu: QuickSettingsMenu, isOpen: boolean)=>void
	onMenuCreated: (maid: Maid, menu: QuickSettingsMenu)=>void
	protected override catchChild(child: any): void {
		const menu = child.menu
		if (!menu) return
		if (this.appliedChild.has(menu)) return

		const menuMaid = new Maid()
		menuMaid.functionJob(()=>{
			this.appliedChild.delete(menu)
		})
		menuMaid.connectJob(menu, "open-state-changed", (_: any, isOpen: boolean) => {
			if (this.onMenuOpen) this.onMenuOpen(menuMaid, menu, isOpen)
		})
		menuMaid.connectJob(menu, "destroy", ()=>{
			menuMaid.destroy()
		})
		if (this.onMenuCreated) this.onMenuCreated(menuMaid, menu)
		this.appliedChild.set(menu, menuMaid)
	}
	protected override getConnectTarget() {
		return Global.QuickSettingsGrid
	}
	get menus() {
		if (!this.appliedChild) return []
		return [...this.appliedChild.keys()]
	}
}

export class QuickSettingsToggleTracker extends ChildrenTrackerBase<QuickToggle|QuickMenuToggle> {
	onToggleCreated: (maid: Maid, toggle: QuickToggle|QuickMenuToggle)=>void
	protected override catchChild(child: any): void {
		if (
			!(child instanceof QuickToggle)
			&& !(child instanceof QuickMenuToggle)
		) return
		if (this.appliedChild.has(child)) return

		const toggleMaid = new Maid()
		toggleMaid.functionJob(()=>{
			this.appliedChild.delete(child)
		})
		toggleMaid.connectJob(child, "destroy", ()=>{
			toggleMaid.destroy()
		})
		if (this.onToggleCreated) this.onToggleCreated(toggleMaid, child)
		this.appliedChild.set(child, toggleMaid)
	}
	protected override getConnectTarget() {
		return Global.QuickSettingsGrid
	}
}

export class SystemIndicatorTracker extends ChildrenTrackerBase<SystemIndicator> {
	onIndicatorCreated: (maid: Maid, indicator: SystemIndicator)=>void
	protected override catchChild(child: any): void {
		if (
			!(child instanceof SystemIndicator)
		) return
		if (this.appliedChild.has(child)) return

		const indicatorMaid = new Maid()
		indicatorMaid.functionJob(()=>{
			this.appliedChild.delete(child)
		})
		indicatorMaid.connectJob(child, "destroy", ()=>{
			indicatorMaid.destroy()
		})
		if (this.onIndicatorCreated) this.onIndicatorCreated(indicatorMaid, child)
		this.appliedChild.set(child, indicatorMaid)
	}
	protected override getConnectTarget() {
		return Global.Indicators
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
