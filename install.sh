#!/usr/bin/env bash

function pack() {
	mkdir dist -p
	gnome-extensions pack src\
		--extra-source=../LICENSE\
		--extra-source=../LICENSE-gnome-volume-mixer\
		--extra-source=features\
		--extra-source=libs\
		--extra-source=prefPages\
		--podir=../po\
		--out-dir=dist\
		--force
}

function compile-preferences() {
	glib-compile-schemas --targetdir=src/schemas src/schemas
}

function update-po() {
	echo '' > messages.po
    find ./src -type f \( -name "*.ui" -or -name "*.js" \) | xgettext --from-code utf-8 -j messages.po -f -
    sed -i 's|"Content\-Type: text/plain; charset=CHARSET\\n"|"Content-Type: text/plain; charset=UTF-8\\n"|g' messages.po
    find ./po -type f -name "*.po" | xargs -i msgmerge {} messages.po -N --no-wrap -U
    mv messages.po $(find ./po -type f -name "*.pot")
}

function build() {
	compile-preferences
	[ "$?" != "0" ] && echo "Failed to compile preferences" && return 1
	pack
	[ "$?" != "0" ] && echo "Failed to pack extension" && return 1
}

function install() {
	build
	[ "$?" != "0" ] && return 1

	gnome-extensions install\
		dist/quick-settings-tweaks@qwreey.shell-extension.zip\
		--force
	[ "$?" != "0" ] && echo "Failed to install extension" && return 1
	echo "Extension was installed. logout and login shell, and check extension list."
}

function dev() {
	build
	echo "Warn: Dev hot reload (restarting) only works on unsafe mode"
	if [[ "$XDG_SESSION_TYPE" == "x11" ]]; then
		busctl --user call org.gnome.Shell /org/gnome/Shell org.gnome.Shell Eval s 'Meta.restart("Restarting…", global.context)'
	else
		echo "Session is not x11 ($XDG_SESSION_TYPE). this session not supports hot reloading. you should logout and login shell again for apply changes"
	fi
}

function log() {
	journalctl /usr/bin/gnome-shell -f -q --output cat | grep '\[EXTENSION QSTweaks\] '
}

function clear-old-po() {
	rm ./po/*.po~
}

function usage() {
    echo 'Usage: ./install.sh COMMAND'
    echo 'COMMAND:'
    echo "  install       install the extension in the user's home directory"
    echo '                under ~/.local'
    echo '  build         Creates a zip file of the extension'
    echo '  update-po     Update po files to match source files'
	echo '  dev           Update installed extension and reload gnome shell.'
	echo '                only works on x11 unsafe mode.'
	echo '  log           show extension logs (live)'
	echo '  clear-old-po  clear *.po~'
}

case "$1" in
    "install" )
        install
    ;;

	"build" )
		build
	;;

	"log" )
		log
	;;

    "dev" )
        dev
    ;;

    "update-po" )
        update-po
    ;;

	"clear-old-po" )
		clear-old-po
	;;
    
    * )
        usage
    ;;
esac
exit
