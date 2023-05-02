build:
	mkdir dist -p
	gnome-extensions pack\
		--extra-source=LICENSE\
		--extra-source=LICENSE-gnome-volume-mixer\
		--extra-source=features\
		--extra-source=libs\
		--extra-source=prefPages\
		--podir=po\
		--out-dir=dist\
		--force

install: build
	gnome-extensions install\
		dist/quick-settings-tweaks@qwreey.shell-extension.zip\
		--force

dev: install
ifeq ($(XDG_SESSION_TYPE),x11)
	busctl --user call org.gnome.Shell /org/gnome/Shell org.gnome.Shell Eval s 'Meta.restart("Restarting…", global.context)'
endif

log:
	journalctl /usr/bin/gnome-shell -f -q --output cat | grep '\[EXTENSION QSTweaks\] '
