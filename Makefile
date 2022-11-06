build:
	mkdir dist -p
	gnome-extensions pack\
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
	pkill gnome-shell &
endif
