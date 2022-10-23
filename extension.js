const Main = imports.ui.main
const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const { VolumeMixerPopupMenu } = Me.imports.volumeMixerPopupMenu

var volumeMixer = null

function enable() {
  // Main.panel.statusArea.quickSettings.menu.addMenuItem
  // Main._test = volumeMixer
  // let menu = new PopupMenu.PopupMenuSection()
  // imports.ui.main.panel.statusArea.quickSettings.menu.box.add_child(menu.actor)
  // menu.addMenuItem(volumeMixer)
  // menu.actor.add_child(volumeMixer.actor)
  //   Main.panel.statusArea.quickSettings._indicators.add_child(volumeMixer)

  //   Grid.add_child(volumeMixer)
  //   Grid.layout_manager.child_set_property(
  //     Grid,
  //     volumeMixer.actor,
  //     'column-span',
  //     2
  //   )

  const volumeMixer = new VolumeMixerPopupMenu()

  Main.panel.statusArea.quickSettings._indicators.add_child(volumeMixer)
}

function disable() {
  // REMINDER: It's required for extensions to clean up after themselves when
  // they are disabled. This is required for approval during review!
  if (volumeMixer !== null) {
    volumeMixer.destroy()
    volumeMixer = null
  }
}
