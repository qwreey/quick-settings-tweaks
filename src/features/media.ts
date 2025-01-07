import { MediaBox } from "../components/mediaBox.js"
import { GnomeContext } from "../libs/gnome.js"
import { FeatureBase, SettingLoader } from "../libs/feature.js"

export class MediaFeature extends FeatureBase {
    // #region settings
    mediaControlEnabled: boolean
    disableAdjustBorder: boolean
    disableRemoveShadow: boolean
    loadSettings(loader: SettingLoader): void {
        this.mediaControlEnabled = loader.loadBoolean("media-control-enabled")
        this.disableAdjustBorder = loader.loadBoolean("disable-adjust-content-border-radius")
        this.disableRemoveShadow = loader.loadBoolean("disable-remove-shadow")
    }
    // #endregion settings

    mediaBox?: MediaBox
    onLoad(): void {
        if (!this.mediaControlEnabled) return
        this.maid.destroyJob(
            this.mediaBox = new MediaBox({})
        )

        GnomeContext.QuickSettingsGrid.add_child(this.mediaBox)
        GnomeContext.QuickSettingsGrid.layout_manager.child_set_property(
            GnomeContext.QuickSettingsGrid, this.mediaBox, 'column-span', 2
        )
    }
}
