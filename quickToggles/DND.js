const { Gio, GObject } = imports.gi;
const { QuickToggle, SystemIndicator } = imports.ui.quickSettings;

const DndQuickToogle = GObject.registerClass(
class DndQuickToogle extends QuickToggle {
    _init() {
        super._init({
            label: _('Do Not Disturb'),
            iconName: 'notifications-disabled-symbolic'
        });

        this._settings = new Gio.Settings({
            schema_id: 'org.gnome.desktop.notifications',
        });

        this._changedId = this._settings.connect('changed::show-banners',
            () => this._sync());

        this.connectObject(
            'destroy', () => this._settings.run_dispose(),
            'clicked', () => this._toggleMode(),
            this);

        this._sync();
    }

    _toggleMode() {
        this._settings.set_boolean('show-banners',
            !this._settings.get_boolean('show-banners'));
    }

    _sync() {
        const checked = !this._settings.get_boolean('show-banners');
        if (this.checked !== checked)
            this.set({checked});
    }
});

var Indicator = GObject.registerClass(
class Indicator extends SystemIndicator {
    _init() {
        super._init();

        this.quickSettingsItems.push(new DndQuickToogle());
    }
});
