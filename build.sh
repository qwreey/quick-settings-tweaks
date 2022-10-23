#!/bin/bash
glib-compile-schemas schemas

rm -rf dist 2> /dev/null
mkdir dist 2> /dev/null
mkdir dist/build 2> /dev/null
cp extension.js dist/build/
cp prefs.js dist/build/
cp metadata.json dist/build/
cp volumeMixerPrefsPage.js dist/build/
cp volumeMixerPopupMenu.js dist/build/
cp volumeMixerAddFilterDialog.js dist/build/
cp applicationStreamSlider.js dist/build/
mkdir dist/build/schemas
cp schemas/app-volume-mixer.gschema.xml dist/build/schemas/
cp schemas/gschemas.compiled dist/build/schemas/
zip -r dist/output.zip dist/build

