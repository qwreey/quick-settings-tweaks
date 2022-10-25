#!/bin/bash
glib-compile-schemas schemas
name="app-volume-mixer@qwreey"
rm -rf dist 2> /dev/null
mkdir dist 2> /dev/null
mkdir dist/$name 2> /dev/null
cp extension.js dist/$name/
cp prefs.js dist/$name/
cp metadata.json dist/$name/
cp volumeMixerPrefsPage.js dist/$name/
cp volumeMixerPopupMenu.js dist/$name/
cp volumeMixerAddFilterDialog.js dist/$name/
cp applicationStreamSlider.js dist/$name/
mkdir dist/$name/schemas
cp schemas/app-volume-mixer.gschema.xml dist/$name/schemas/
cp schemas/gschemas.compiled dist/$name/schemas/
cd dist/$name
zip -r ../output.zip ./
cd ../..
