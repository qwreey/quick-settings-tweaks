const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { featureReloader } = Me.imports.libs.utility
const { QuickSettings, InputStreamSlider, OutputStreamSlider } = Me.imports.libs.gnome
const { Label } = imports.gi.St
const Volume = imports.ui.status.volume
const PopupMenu = imports.ui.popupMenu

var inputOutputFeature = class {
    load() {
        // setup reloader
        featureReloader.enableWithSettingKeys(this, [
            "output-show-selected",
            "input-show-selected",
            "input-always-show"
        ])

        this._outputListener = null
        this._inputListener = null
        this._inputVisibilityListener = null

        if (this.settings.get_boolean("input-show-selected")) {
            this._setupInputChangedListener()
        }
        if (this.settings.get_boolean("input-always-show")) {
            this._setupInputVisibilityObserver()
        }
        if (this.settings.get_boolean("output-show-selected")) {
            this._setupOutputChangedListener()
        }
    }

    unload() {
        // disable feature reloader
        featureReloader.disable(this)

        if (this._inputListener) {
            this._detachInputLabel()
            Volume.getMixerControl().disconnect(this._inputListener)
            this._inputListener = null
        }
        if (this._inputVisibilityListener) {
            InputStreamSlider.disconnect(this._inputVisibilityListener)
            this._inputVisibilityListener = null
            InputStreamSlider.visible = InputStreamSlider._shouldBeVisible()
        }
        if (this._outputListener) {
            this._detachOutputLabel()
            Volume.getMixerControl().disconnect(this._outputListener)
            this._outputListener = null
        }
    }

    // =========================================== Ouput ===========================================
    _setupOutputChangedListener() {
        this._attachOutputLabel()
        this._outputListener = Volume.getMixerControl().connect('active-output-update', (c, id) => this._onOutputDeviceChanged(id))
    }

    _onOutputDeviceChanged(deviceId) {
        const device = Volume.getMixerControl().lookup_output_id(deviceId)
        this.outputLabel.text = this._getDeviceName(device)
    }

    _attachOutputLabel() {
        this.outputLabel = new Label()
        this.outputLabel.style_class = "QSTWEAKS-volume-mixer-label"
        QuickSettings.menu.addItem(this.outputLabel, 2);
        QuickSettings.menu._grid.set_child_below_sibling(this.outputLabel, OutputStreamSlider);
        this.outputLabel.visible = this.settings.get_boolean("output-show-selected")
        this.outputLabel.text = this._findActiveDevice(OutputStreamSlider)
    }

    _detachOutputLabel() {
        if (this.outputLabel && this.outputLabel.get_parent()) {
            this.outputLabel.get_parent().remove_child(this.outputLabel)
            this.outputLabel = null
        }
    }

    // =========================================== Input ===========================================
    _setupInputChangedListener() {
        this._attachInputLabel()
        this._inputListener = Volume.getMixerControl().connect('active-input-update', (c, id) => this._onInputDeviceChanged(id))
    }

    _attachInputLabel() {
        this.inputLabel = new Label()
        this.inputLabel.style_class = "QSTWEAKS-volume-mixer-label"
        QuickSettings.menu.addItem(this.inputLabel, 2);
        QuickSettings.menu._grid.set_child_below_sibling(this.inputLabel, InputStreamSlider);
        this._setInputLabelVisibility()
        this.inputLabel.text = this._findActiveDevice(InputStreamSlider)
    }

    _onInputDeviceChanged(deviceId) {
        const device = Volume.getMixerControl().lookup_input_id(deviceId)
        this.inputLabel.text = this._getDeviceName(device)
    }

    _detachInputLabel() {
        if (this.inputLabel && this.inputLabel.get_parent()) {
            this.inputLabel.get_parent().remove_child(this.inputLabel)
            this.inputLabel = null
        }
    }

    // =========================================== Input Visbility ===========================================
    _setupInputVisibilityObserver() {
        this._inputVisibilityListener = InputStreamSlider.connect("notify::visible", () => this._onInputStreamSliderSynced())
        this._onInputStreamSliderSynced()
    }

    _onInputStreamSliderSynced() {
        this._setInputStreamSliderVisibility()
        if (this._inputListener) {
            this._setInputLabelVisibility()
        }
    }

    _setInputStreamSliderVisibility() {
        InputStreamSlider.visible = InputStreamSlider._shouldBeVisible() || this.settings.get_boolean("input-always-show")
    }

    _setInputLabelVisibility() {
        this.inputLabel.visible = InputStreamSlider.visible && this.settings.get_boolean("input-show-selected")
    }


    // =========================================== Utils ===========================================
    _findActiveDevice(sliderObject) {
        // find the current selected input and grab the input text from that
        let menuChildren = sliderObject.menu.box.get_children()[1].get_children()
        for (let index = 0; index < menuChildren.length; index++) {
            let item = menuChildren[index]
            if (item._ornament == PopupMenu.Ornament.CHECK) {
                return item.label.text
            }
        }
        return null
    }

    _getDeviceName(device) {
        if (!device)
            return

        const { description, origin } = device
        const name = origin
            ? `${description} – ${origin}`
            : description

        return name
    }
}
