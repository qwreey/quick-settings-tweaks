<!-- markdownlink-ignore: MD025 -->
# 2.1-pre2
<!-- @BuildNumber: 2 -->
<!-- @Includes: [] -->
<!-- @Date: "2025-1-22 13:16:00 KST" -->

## New Features

- Add quick toggle ordering and hiding
- Add page indicator on media widget

## Fix

- Fix changelog text align
- Fix pref page scroll flickering issue
- Fix weather widget empty when no location selected issue

# 2.1-pre1
<!-- @BuildNumber: 1 -->
<!-- @Includes: [] -->
<!-- @Date: "2025-1-22 13:16:00 KST" -->

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
