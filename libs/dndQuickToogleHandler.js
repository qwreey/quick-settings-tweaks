const { Gio, GObject } = imports.gi;
const { QuickToggle, SystemIndicator } = imports.ui.quickSettings;
const { St } = imports.gi
const Main  = imports.ui.main;

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
        
        this._sources = [];
        this._count = 0;


	this._indicator = this._addIndicator();

	this._indicator.icon_name = 'notifications-disabled-symbolic'
        this.quickSettingsItems.push(new DndQuickToogle());

        this._settings = new Gio.Settings({
            schema_id: 'org.gnome.desktop.notifications',
        });

        this._settings.connect('changed::show-banners', this._sync.bind(this));

        Main.messageTray.connect('source-added', this._onSourceAdded.bind(this));
        Main.messageTray.connect('source-removed', this._onSourceRemoved.bind(this));
        Main.messageTray.connect('queue-changed', this._updateCount.bind(this));


        let sources = Main.messageTray.getSources();
        sources.forEach(source => this._onSourceAdded(null, source));
        
        
        this._sync();

        this.connect('destroy', () => {
            this._settings.run_dispose();
            this._settings = null;
        });

    }
    
    
    _onSourceAdded(tray, source) {
        source.connect('notify::count', this._updateCount.bind(this));
        this._sources.push(source);
        this._updateCount();
    }

    _onSourceRemoved(tray, source) {
        this._sources.splice(this._sources.indexOf(source), 1);
        this._updateCount();
    }

    _updateCount() {
        let count = 0;
        this._sources.forEach(source => (count += source.unseenCount));
        this._count = count - Main.messageTray.queueCount;
        this._sync();
    }

    
    _sync() {
        let doNotDisturb = !this._settings.get_boolean('show-banners');
        
        this._indicator.icon_name = doNotDisturb
            ? 'notifications-disabled-symbolic'
            : 'message-indicator-symbolic';
        this._indicator.visible = doNotDisturb || this._count > 0;
        
    }
    

});
