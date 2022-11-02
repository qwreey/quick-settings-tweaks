#!/bin/bash
name="quick-settings-tweaks@qwreey"
./build.sh
cp -r dist/$name ~/.local/share/gnome-shell/extensions/
pkill gnome-shell &
