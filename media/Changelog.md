<!-- markdownlint-disable-file MD025 MD024 MD034 -->
<!-- Note: -->
<!-- This file is visible in prefs so if -->
<!-- it is erased it may cause an error -->
# 2.1-pre5
<!-- @BuildNumber: 5 -->
<!-- @Includes: [] -->
<!-- @Date: "2025-02-04 09:31:00 KST" -->
<!-- @Git: "0f05873" -->

- List the license in more detail

## New Features

- Media widget
  <!-- - Add cover image round clip effect option -->
  - Add round clip effect detailed option
- Date menu
  - Add hide left box option
  - Add hide right box option
  - Add menu disable option
  - Add menu button hide option

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
