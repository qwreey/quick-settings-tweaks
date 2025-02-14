import GObject from "gi://GObject"
import {
    type SystemIndicator,
} from "resource:///org/gnome/shell/ui/quickSettings.js"

export interface SystemIndicatorOrderItem {
    gtypeName?: string
    constructorName?: string
    friendlyName?: string
    nonOrdered?: boolean
    isSystem?: boolean
    hide?: boolean
}
export namespace SystemIndicatorOrderItem {
    export function match(a: SystemIndicatorOrderItem, b: SystemIndicatorOrderItem) {
        if (
            a.isSystem != b.isSystem
            || a.nonOrdered != b.nonOrdered
            || a.hide != b.hide
        ) return false
        if (a.nonOrdered) return true
        if (a.isSystem) return a.gtypeName == b.gtypeName
        return (
            a.constructorName == b.constructorName
            && a.friendlyName == b.friendlyName
            && a.gtypeName == b.gtypeName
        )
    }
    export function indicatorMatch(item: SystemIndicatorOrderItem, indicator: SystemIndicator): boolean {
        if (item.nonOrdered) return false
        if (item.gtypeName && GObject.type_name_from_instance(indicator as any) != item.gtypeName)
            return false
        if (item.constructorName && indicator.constructor.name != item.constructorName)
            return false
        return true
    }
    export const Default: SystemIndicatorOrderItem = {
        hide: false,
        constructorName: "",
        friendlyName: "",
        gtypeName: "",
    }
    export function create(friendlyName: string): SystemIndicatorOrderItem {
        return {
            ...Default,
            friendlyName,
        }
    }
}
