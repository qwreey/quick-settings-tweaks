#!/bin/bash
name="app-volume-mixer@qwreey"
./build.sh
cp -r dist/$name ~/.local/share/gnome-shell/extensions/
