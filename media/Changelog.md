<!-- markdownlint-disable-file MD025 MD024 MD034 -->
<!-- Note: -->
<!-- This file is visible in prefs so if -->
<!-- it is erased it may cause an error -->
# 2.2-stable
<!-- @BuildNumber: 9 -->
<!-- @Includes: [] -->
<!-- @Date: "2025-07-15 00:37:00 KST" -->
<!-- @Git: "7142389" -->

{{HEADER}}

- Drop gnome 46, 47 support
- Add support for gnome 48
- Remove non-compatible feature
  - Date Menu
    - Hide Media Control
    - Hide Notifications

## Fix

- Weather widget
  - Fix 'already disposed' warning
- DND Toggle
  - Fix missing icon when it's turned off by PR #191
- Notification
  - Better padding for Native notifications clear button by PR #184
- Fix settings names by PR #183

# 2.1-stable
<!-- @BuildNumber: 8 -->
<!-- @Includes: [] -->
<!-- @Date: "2025-02-15 04:25:00 KST" -->
<!-- @Git: "5428193" -->

{{HEADER}}

- Layout editor shows only useful items
  > For example, a DND quick toggle only appears when enabled
- Migration for gnome 48 (partially)
  - 'vertical' property migration
- Fix some typescript type errors
- Update locales
- Add github sponsor (replace original one)

## New Features

- Menu animation
  - Add background brightness option
- Weather widget
  - Add show or hide location label option
  - Add max forecasts option
  - Add weather interval option
- System Indicators
  - Monochrome option for privacy indicators

## Fix

- System Indicators
  - Fix accent indicators color not match with shell accent color
- Weather widget
  - Fix status label style
- Fix project name

# 2.1-pre7
<!-- @BuildNumber: 7 -->
<!-- @Includes: [] -->
<!-- @Date: "2025-02-12 4:56:00 KST" -->
<!-- @Git: "dafca5e" -->

{{HEADER}}

- Improve ordering editors
- Update locale files
- Migration for gnome 48 (partially)
  - Media widget: Lowered GNOME Shell API dependency for backwards compatibility

## New Features

- Quick toggle layout
  - Add GType name filter option
  - Now you can hide 'Unsorted items'
- System indicators layout
  - Add ordering and hiding option
  - Add accent screen sharing &amp; recording indicators option
  - Add accent privacy indicators option

## Fix

- Default value optimization for menu animation
- Fix broken scrollbar padding
- Fix mixer description only shows 'Playback Stream'
- Fix smooth scroll cause scrolling issue on media widget
- Fix mixer widget menu section initial state
- Fix #170, some quick toggles are not hiding
- Fix 'has been already disposed' error on weather widget
- Fix '(intermediate value).Extension.features is null' error when extension unloading

# 2.1-pre6
<!-- @BuildNumber: 6 -->
<!-- @Includes: [] -->
<!-- @Date: "2025-02-09 03:57:00 KST" -->
<!-- @Git: "30ad4df" -->

{{HEADER}}

- Reduce reloading cost

## New Features

- Media widget
  - Add adjust smooth scroll speed option
- Overlay menu
  - Smoother animation
  - Better animation start offset for flyout style
- Volume mixer widget
  - Add show stream icon option
  - Add attach menu to output slider option

## Fix

- Media widget
  - Fix 'event.moveStartCoords is undefined' error

# 2.1-pre5
<!-- @BuildNumber: 5 -->
<!-- @Includes: [] -->
<!-- @Date: "2025-02-08 13:49:00 KST" -->
<!-- @Git: "7acb2a4" -->

{{HEADER}}

- List the license in more detail
- Weather feature is now stable

## New Features

- Media widget
  - Add round clip effect detailed option
  - Support trackpad and trackpoint smooth scroll
- Date menu
  - Add hide left box option
  - Add hide right box option
  - Add menu disable option
  - Add menu button hide option
- VolumeMixer widget
  - Migrated from 1.18

## Fix

- Fix 'st_widget_get_theme_node called on the widget which is not in the stage' issue

## Prefs QOL patch

- Add detailed button on some options

# 2.1-pre4
<!-- @BuildNumber: 4 -->
<!-- @Includes: [] -->
<!-- @Date: "2025-02-03 09:31:00 KST" -->
<!-- @Git: "0f05873" -->

{{HEADER}}

- Changelog viewer enchantments
  - Show build number, git hash, and date in detailed view

## New Features

- Media widget
  - Add gradient background option
  - Add progress bar style option
  - Add contorl button opacity option
  - Implement swipe to switch page
  - Implement round clip effect to make transition better
- Weather widget
  - Add click command option
- Debugging
  - Expose features

## Fix

- Fix gnome-shell segfault on dragging media widget
- Media widget
  - Fix page indicator click action

## New Licenses

- rounded-window-corners
  - Auther: yilozt
  - URL: https://github.com/yilozt/rounded-window-corners

# 2.1-pre3
<!-- @BuildNumber: 3 -->
<!-- @Includes: [] -->
<!-- @Date: "2025-01-31 20:39:00 KST" -->
<!-- @Git: "0f05873" -->

{{HEADER}}

- Update repo url in metadata

## New Features

- Option to hide dnd indicator completely
- Debugging
  - Use better logging format
  - Add logging level option
  - Add extension environment expose option
- Notifications widget
  - Add vfade offset option
  - Add scrollbar visibility option

## Fix

- Fix 'PageIndicators has been already disposed' issue
- Add more promise catch handlers and source naming for debugging
- Removed fixStScrollViewScrollbarOverflow, use vscrollbar_policy instead

## Known issues

- Cannot hide keyboard quick toggle

# 2.1-pre2
<!-- @BuildNumber: 2 -->
<!-- @Includes: [] -->
<!-- @Date: "2025-01-23 00:40:00 KST" -->
<!-- @Git: "1ef912f" -->

{{HEADER}}

## New Features

- Add quick toggle ordering and hiding
- Add page indicator on media widget
- Add DND indicator position option
- Add save last session state option on unsafe mode quick toggle

## Fix

- Fix changelog text align
- Fix pref page scroll flickering issue
- Fix weather widget empty when no location selected issue

## Prefs QOL patch

- Move contributor rows to dialog

# 2.1-pre1
<!-- @BuildNumber: 1 -->
<!-- @Includes: [] -->
<!-- @Date: "2025-01-22 13:16:00 KST" -->
<!-- @Git: "724eedd" -->

{{HEADER}}

- **Droped gnome-shell 43 and 44 support COMPLETELY** due to ESM incompatible
- Using major.middle.minor version system
- Using girs and typescript, for better development
- New stable, github-stable, github-preview release channel

## Shell version bump

shell-version >= 45, >= 48

## Prefs QOL patch

- Some space rich option groups are now using bottom sheet layout
- Add button for reset modified options
- Organize about section
  - Add changelogs subpage

## New Features

- Reorder and hide system items
- Reanimate menu, overlay menu mode
- Weather widget

## Known issues

- Sometime, the media progress bar displayed even should't be displayed
- Weather widget shows empty box when region wasn't selected
