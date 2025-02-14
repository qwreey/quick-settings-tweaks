export interface QuickSettingsOrderItem {
    id?: string
    lineBreak?: boolean
    pageBreak?: boolean
    hide?: boolean // not used
    friendlyName?: string // not used
}
export namespace QuickSettingsOrderItem {
    export function match(a: QuickSettingsOrderItem, b: QuickSettingsOrderItem) {
        return a.id == b.id
    }
}
