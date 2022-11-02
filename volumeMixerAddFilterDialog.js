const { Gtk, GObject } = imports.gi

var VolumeMixerAddFilterDialog = GObject.registerClass({
    GTypeName: 'VolumeMixerAddFilterDialog',
}, class VolumeMixerAddFilterDialog extends Gtk.Dialog {
    appNameEntry
    filterListData

    constructor(callingWidget, filterListData) {
        super({
            use_header_bar: true,
            transient_for: callingWidget.get_root(),
            destroy_with_parent: true,
            modal: true,
            resizable: false,
            title: "Add Application to filtering"
        })

        this.filterListData = filterListData

        const addButton = this.add_button("Add", Gtk.ResponseType.OK)
        addButton.get_style_context().add_class('suggested-action')
        addButton.sensitive = false
        this.add_button("Cancel", Gtk.ResponseType.CANCEL)

        const dialogContent = this.get_content_area()
        dialogContent.margin_top = 20
        dialogContent.margin_bottom = 20
        dialogContent.margin_end = 20
        dialogContent.margin_start = 20

        const appNameLabel = new Gtk.Label({
            label: "Application name",
            halign: Gtk.Align.START,
            margin_bottom: 10
        })
        dialogContent.append(appNameLabel)

        this.appNameEntry = new Gtk.Entry()
        this.appNameEntry.connect('activate', () => {
            if (this.checkInputValid()) {
                this.response(Gtk.ResponseType.OK)
            }
        })
        dialogContent.append(this.appNameEntry)

        this.appNameEntry.connect("changed", () => {
            addButton.sensitive = this.checkInputValid()
        })
    }

    checkInputValid() {
        if (this.appNameEntry.text.length === 0) {
            return false
        } else if (this.filterListData.indexOf(this.appNameEntry.text) !== -1) {
            return false
        } else {
            return true
        }
    }
})
