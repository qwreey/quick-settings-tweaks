import GLib from "gi://GLib"
import Clutter from "gi://Clutter"
import St from "gi://St"
import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js"
import {
	QuickMenuToggle,
	QuickToggle,
} from "resource:///org/gnome/shell/ui/quickSettings.js"
import { FeatureBase, type SettingLoader } from "../../libs/shell/feature.js"
import { QuickSettingsToggleTracker } from "../../libs/shell/quickSettingsUtils.js"
import Global from "../../global.js"

type ToggleItem = QuickToggle|QuickMenuToggle

export class QuickSettingsPaginationFeature extends FeatureBase {
	enabled: boolean
	rowsPerPage: number
	currentPage = 0
	totalPages = 1
	tracker: QuickSettingsToggleTracker
	indicatorRow: St.BoxLayout
	dotBox: St.BoxLayout
	indicatorDots: St.Button[]
	prevButton: St.Button
	nextButton: St.Button
	pendingUpdateId: number
	toggleStates: Map<ToggleItem, boolean>

	override loadSettings(loader: SettingLoader): void {
		this.enabled = loader.loadBoolean("quick-settings-pagination-enabled")
		this.rowsPerPage = Math.max(1, loader.loadInt("quick-settings-pagination-rows") || 1)
	}

	override onLoad(): void {
		if (!this.enabled) return
		this.toggleStates = new Map()
		this.currentPage = 0
		this.totalPages = 1
		this.createIndicator()
		this.tracker = new QuickSettingsToggleTracker()
		this.tracker.onToggleCreated = (maid, toggle) => {
			maid.connectJob(toggle, "destroy", () => this.queueUpdate())
			maid.connectJob(toggle, "notify::visible", () => this.queueUpdate())
		}
		this.tracker.onUpdate = () => this.queueUpdate()
		this.tracker.load()
		this.queueUpdate()
	}

	override onUnload(): void {
		if (this.pendingUpdateId) {
			GLib.source_remove(this.pendingUpdateId)
			this.pendingUpdateId = 0
		}
		this.tracker?.unload()
		this.tracker = null
		this.destroyIndicator()
		this.restoreVisibility()
		this.toggleStates = null
		this.currentPage = 0
		this.totalPages = 1
	}

	private queueUpdate(): void {
		if (this.pendingUpdateId) return
		this.pendingUpdateId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
			this.pendingUpdateId = 0
			this.applyPagination()
			return GLib.SOURCE_REMOVE
		})
	}

	private applyPagination(): void {
		if (!this.enabled) return
		const grid = Global.QuickSettingsGrid
		if (!grid) return
		this.restoreVisibility()
		const toggles = this.getOrderedToggles()
		const rows = this.buildRows(toggles)
		const rowsPerPage = Math.max(1, this.rowsPerPage)
		const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage) || 1)
		this.totalPages = totalPages
		if (this.currentPage > totalPages - 1) this.currentPage = totalPages - 1
		if (this.currentPage < 0) this.currentPage = 0
		if (totalPages === 1) {
			this.updateIndicator()
			return
		}
		const start = this.currentPage * rowsPerPage
		const end = start + rowsPerPage
		rows.forEach((row, index) => {
			const shouldShow = index >= start && index < end
			if (shouldShow) return
			for (const toggle of row) this.hideToggle(toggle)
		})
		this.updateIndicator()
	}

	private getOrderedToggles(): ToggleItem[] {
		const grid = Global.QuickSettingsGrid
		if (!grid) return []
		const children = grid.get_children()
		return children.filter((child): child is ToggleItem => (
			(child instanceof QuickToggle || child instanceof QuickMenuToggle)
			&& child.constructor.name !== "BackgroundAppsToggle"
		))
	}

	private buildRows(items: ToggleItem[]): ToggleItem[][] {
		const grid = Global.QuickSettingsGrid
		const layout = grid?.layout_manager as any
		const columnCount = Math.max(1, layout?.n_columns ?? layout?.nColumns ?? 2)
		const rows: ToggleItem[][] = []
		let lineIndex = 0
		let currentRow: ToggleItem[]
		const appendRow = () => {
			currentRow = []
			rows.push(currentRow)
			lineIndex = 0
		}
		for (const toggle of items) {
			if (!toggle.visible) continue
			if (lineIndex === 0) appendRow()
			const colSpan = this.getColumnSpan(layout, grid, toggle, columnCount)
			const fitsRow = lineIndex + colSpan <= columnCount
			if (!fitsRow) appendRow()
			currentRow.push(toggle)
			lineIndex = (lineIndex + colSpan) % columnCount
		}
		return rows
	}

	private getColumnSpan(layout: any, grid: St.Widget, toggle: ToggleItem, columnCount: number): number {
		const meta = layout?.get_child_meta?.(grid, toggle)
		const span = meta?.column_span ?? meta?.columnSpan ?? meta?.["column-span"] ?? 1
		return Math.max(1, Math.min(columnCount, span))
	}

	private hideToggle(toggle: ToggleItem): void {
		if (!this.toggleStates) return
		if (!this.toggleStates.has(toggle)) {
			this.toggleStates.set(toggle, toggle.visible)
		}
		toggle.visible = false
	}

	private restoreVisibility(): void {
		if (!this.toggleStates?.size) return
		for (const [toggle, wasVisible] of this.toggleStates.entries()) {
			this.toggleStates.delete(toggle)
			if (!toggle || !toggle.get_parent()) continue
			toggle.visible = wasVisible
		}
	}

	private createIndicator(): void {
		if (this.indicatorRow) return
		const grid = Global.QuickSettingsGrid
		const parent = grid?.get_parent()
		if (!grid || !parent) return
		const row = this.indicatorRow = new St.BoxLayout({
			style_class: "qst-pagination-row",
			y_align: Clutter.ActorAlign.CENTER,
			x_align: Clutter.ActorAlign.CENTER,
		})
		row.visible = false
		const prevButton = this.prevButton = new St.Button({
			style_class: "qst-pagination-button icon-button",
			child: new St.Icon({ icon_name: "go-previous-symbolic" }),
			can_focus: true,
			accessible_name: _("Go to previous page"),
			x_expand: false,
			y_expand: false,
		})
		const nextButton = this.nextButton = new St.Button({
			style_class: "qst-pagination-button icon-button",
			child: new St.Icon({ icon_name: "go-next-symbolic" }),
			can_focus: true,
			accessible_name: _("Go to next page"),
			x_expand: false,
			y_expand: false,
		})
		const dotBox = this.dotBox = new St.BoxLayout({
			style_class: "qst-pagination-dots",
			x_expand: false,
			x_align: Clutter.ActorAlign.CENTER,
			y_align: Clutter.ActorAlign.CENTER,
		})
		this.indicatorDots = []
		row.add_child(prevButton)
		row.add_child(dotBox)
		row.add_child(nextButton)
		parent.insert_child_above(row, grid)
		this.maid.connectJob(prevButton, "clicked", () => this.goToPreviousPage())
		this.maid.connectJob(nextButton, "clicked", () => this.goToNextPage())
	}

	private destroyIndicator(): void {
		if (!this.indicatorRow) return
		if (this.indicatorRow.get_parent()) {
			this.indicatorRow.get_parent().remove_child(this.indicatorRow)
		}
		this.indicatorDots?.forEach(dot => dot.destroy())
		this.indicatorDots = null
		this.dotBox = null
		this.indicatorRow.destroy()
		this.indicatorRow = null
		this.prevButton = null
		this.nextButton = null
	}

	private updateIndicator(): void {
		if (!this.indicatorRow || !this.prevButton || !this.nextButton) return
		this.syncDots()
		const hasMultiplePages = this.totalPages > 1
		this.indicatorRow.visible = hasMultiplePages
		if (!hasMultiplePages) return
		const canGoBack = this.currentPage > 0
		const canGoForward = this.currentPage < this.totalPages - 1
		this.prevButton.reactive = canGoBack
		this.prevButton.opacity = canGoBack ? 255 : 96
		this.nextButton.reactive = canGoForward
		this.nextButton.opacity = canGoForward ? 255 : 96
		this.indicatorDots?.forEach((dot, index) => {
			if (index == this.currentPage) {
				dot.add_style_class_name("qst-pagination-dot-active")
			} else {
				dot.remove_style_class_name("qst-pagination-dot-active")
			}
		})
	}

	private goToPreviousPage(): void {
		if (this.currentPage === 0) return
		this.currentPage -= 1
		this.applyPagination()
	}

	private goToNextPage(): void {
		if (this.currentPage >= this.totalPages - 1) return
		this.currentPage += 1
		this.applyPagination()
	}

	private goToPage(index: number): void {
		if (index === this.currentPage) return
		if (index < 0 || index > this.totalPages - 1) return
		this.currentPage = index
		this.applyPagination()
	}

	private syncDots(): void {
		if (!this.dotBox) return
		if (!this.indicatorDots) this.indicatorDots = []
		while (this.indicatorDots.length > this.totalPages) {
			const dot = this.indicatorDots.pop()
			dot.get_parent()?.remove_child(dot)
			dot.destroy()
		}
		for (let index = this.indicatorDots.length; index < this.totalPages; index++) {
			const dot = new St.Button({
				style_class: "qst-pagination-dot",
				can_focus: true,
				reactive: true,
				accessible_name: _("Go to page %d").format(index + 1),
				x_expand: false,
				y_expand: false,
			})
			const targetIndex = index
			this.maid.connectJob(dot, "clicked", () => this.goToPage(targetIndex))
			this.dotBox.add_child(dot)
			this.indicatorDots.push(dot)
		}
	}
}
