#!/bin/bash
glib-compile-schemas schemas
name="quick-settings-tweaks@qwreey"
rm -rf dist 2> /dev/null
mkdir dist 2> /dev/null
mkdir dist/$name 2> /dev/null
cp extension.js dist/$name/
cp prefs.js dist/$name/
cp metadata.json dist/$name/

cp quickTogglesManager.js dist/$name/
cp notifications.js dist/$name/
cp streamSlider.js dist/$name/
cp volumeMixer.js dist/$name/
cp volumeMixerAddFilterDialog.js dist/$name/
cp stylesheet.css dist/$name/
cp -r quickToggles/ dist/$name/

mkdir dist/$name/schemas
cp schemas/org.gnome.shell.extensions.quick-settings-tweaks.gschema.xml dist/$name/schemas/
cp schemas/gschemas.compiled dist/$name/schemas/
cd dist/$name
zip -r ../output.zip ./
cd ../..
