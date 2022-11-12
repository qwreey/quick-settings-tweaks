const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const featureReloader = Me.imports.libs.featureReloader
const { addChildWithIndex } = Me.imports.libs.utility
const { QuickSettingsGrid } = Me.imports.libs.gnome
const { Label } = imports.gi.St
const Volume = imports.ui.status.volume
const PopupMenu = imports.ui.popupMenu;

var inputOutputFeature = class {
    load() {
        // setup reloader
        featureReloader.enableWithSettingKeys(this,[
            "output-show-selected",
            "input-show-selected",
            "input-always-show"
        ])

        this._setupOutputChangedListener()
        this._setupInputChangedListener()
        this._setupInputVisibilityObserver()
    }

    unload() {
        // disable feature reloader
        featureReloader.disable(this)

        this._detachOutputLabel()
        Volume.getMixerControl().disconnect(this._outputListener)
        this._outputListener = null

        this._detachInputLabel()
        Volume.getMixerControl().disconnect(this._inputListener)
        this._inputListener = null

        this._getInputStreamSlider().disconnect(this._inputVisibilityListener)
        this._inputVisibilityListener = null
        this._getInputStreamSlider().visible = this._getInputStreamSlider()._shouldBeVisible()
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
        addChildWithIndex(QuickSettingsGrid, this.outputLabel, this._getOutputStreamSliderIndex() - 1);
        this._spanTwoColumns(this.outputLabel)
        this.outputLabel.visible = this.settings.get_boolean("output-show-selected")
        this.outputLabel.text = this._findActiveDevice(this._getOutputStreamSlider())
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
        this._outputListener = Volume.getMixerControl().connect('active-input-update', (c, id) => this._onInputDeviceChanged(id))
    }

    _attachInputLabel() {
        this.inputLabel = new Label()
        this.inputLabel.style_class = "QSTWEAKS-volume-mixer-label"
        addChildWithIndex(QuickSettingsGrid, this.inputLabel, this._getInputStreamSliderIndex() - 1)
        this._spanTwoColumns(this.inputLabel)
        this._setInputLabelVisibility()
        this.inputLabel.text = this._findActiveDevice(this._getInputStreamSlider())
    }

    _onInputDeviceChanged(deviceId) {
        const device = Volume.getMixerControl().lookup_input_id(deviceId)
        this.inputLabel.text = this._getDeviceName(device)
    }

    _detachInputLabel() {
        if (this.inputLabel && this.inputLabel.get_parent()) {
            this.inputLabel.visible = true
            this.inputLabel.get_parent().remove_child(this.inputLabel)
            this.inputLabel = null
        }
    }

    // =========================================== Input Visbility ===========================================
    _setupInputVisibilityObserver() {
        this._inputVisibilityListener = this._getInputStreamSlider().connect("notify::visible", () => this._onInputStreamSliderSynced())
        this._onInputStreamSliderSynced()
    }

    _onInputStreamSliderSynced() {
        this._setInputStreamSliderVisibility()
        this._setInputLabelVisibility()
    }

    _setInputStreamSliderVisibility() {
        this._getInputStreamSlider().visible = this._getInputStreamSlider()._shouldBeVisible() || this.settings.get_boolean("input-always-show")
    }

    _setInputLabelVisibility() {
        this.inputLabel.visible = this._getInputStreamSlider().visible && this.settings.get_boolean("input-show-selected")
    }


    // =========================================== Utils ===========================================
    _getInputStreamSlider() {
        return this._getUiObject("InputStreamSlider")
    }

    _getInputStreamSliderIndex() {
        return this._getUiObjectIndex("InputStreamSlider")
    }

    _getOutputStreamSlider() {
        return this._getUiObject("OutputStreamSlider")
    }

    _getOutputStreamSliderIndex() {
        return this._getUiObjectIndex("OutputStreamSlider")
    }

    _getUiObject(constructorName) {
        let gridChildren = QuickSettingsGrid.get_children()
        let index = this._getUiObjectIndex(constructorName)
        if (index) {
            return gridChildren[index]
        }
        return null
    }

    _getUiObjectIndex(constructorName) {
        let gridChildren = QuickSettingsGrid.get_children()
        let outputSliderIndex
        for (let index = 0; index<gridChildren.length; index++) {
            if (gridChildren[index]?.constructor?.name == constructorName) {
                return index
            }
        }
        return null
    }

    _findActiveDevice(sliderObject) {
        // find the current selected input and grab the input text from that
        let menuChildren = sliderObject.menu.box.get_children()[1].get_children()
        for (let index = 0; index<menuChildren.length; index++) {
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

        const {description, origin} = device;
        const name = origin
            ? `${description} – ${origin}`
            : description

        return name
    }

    _spanTwoColumns(object) {
        QuickSettingsGrid.layout_manager.child_set_property(QuickSettingsGrid, object, 'column-span', 2)
    }
};
