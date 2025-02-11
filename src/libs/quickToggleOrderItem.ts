import GObject from "gi://GObject"
import {
    type QuickToggle,
    type QuickMenuToggle,
} from "resource:///org/gnome/shell/ui/quickSettings.js"

export interface QuickToggleOrderItem {
    gtypeName?: string
    constructorName?: string
    titleRegex?: string
    friendlyName?: string
    nonOrdered?: boolean
    isSystem?: boolean
    cachedTitleRegex?: RegExp
    hide?: boolean
}
export namespace QuickToggleOrderItem {
    export function match(a: QuickToggleOrderItem, b: QuickToggleOrderItem) {
        if (
            a.isSystem != b.isSystem
            || a.nonOrdered != b.nonOrdered
            || a.hide != b.hide
        ) return false
        if (a.nonOrdered) return true
        if (a.isSystem) return a.constructorName == b.constructorName
        return (
            a.constructorName == b.constructorName
            && a.titleRegex == b.titleRegex
            && a.friendlyName == b.friendlyName
            && a.gtypeName == b.gtypeName
        )
    }
    export function toggleMatch(item: QuickToggleOrderItem, toggle: QuickToggle|QuickMenuToggle): boolean {
        if (item.gtypeName && GObject.type_name_from_instance(toggle as any) != item.gtypeName)
            return false
        if (item.constructorName && toggle.constructor.name != item.constructorName)
            return false
        if (item.cachedTitleRegex && toggle.title.match(item.cachedTitleRegex) == null)
            return false
        if (!item.gtypeName && !item.constructorName && !item.cachedTitleRegex) return false
        return true
    }
    export const Default: QuickToggleOrderItem = {
        hide: false,
        titleRegex: "",
        constructorName: "",
        friendlyName: "",
        gtypeName: "",
    }
    export function create(friendlyName: string): QuickToggleOrderItem {
        return {
            ...Default,
            friendlyName,
        }
    }
}
