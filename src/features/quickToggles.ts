import { MediaWidget } from "../components/mediaWidget.js"
import { Global } from "../global.js"
import { FeatureBase, SettingLoader } from "../libs/feature.js"

export interface OrderItem {
    constructorName?: string
    labelTextRegex?: string
    nonOrdered?: boolean
    isSystem?: boolean
    friendlyName?: string
}

