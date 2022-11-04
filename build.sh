#!/bin/bash
name="quick-settings-tweaks@qwreey"
rm -rf dist 2> /dev/null
mkdir dist 2> /dev/null
mkdir dist/$name 2> /dev/null

# copy files
cp extension.js dist/$name/
cp prefs.js dist/$name/
cp metadata.json dist/$name/
cp stylesheet.css dist/$name/
cp -r quickToggles/ dist/$name/
cp -r features/ dist/$name/
cp -r libs/ dist/$name/

# build schemas
glib-compile-schemas schemas
mkdir dist/$name/schemas
cp schemas/org.gnome.shell.extensions.quick-settings-tweaks.gschema.xml dist/$name/schemas/
cp schemas/gschemas.compiled dist/$name/schemas/

# make zip file
cd dist/$name
zip -r ../output.zip ./
cd ../..
