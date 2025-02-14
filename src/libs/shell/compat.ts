import { PACKAGE_VERSION } from 'resource:///org/gnome/shell/misc/config.js'
import Clutter from "gi://Clutter"

export const GnomeVersion = Number.parseFloat(PACKAGE_VERSION)

export const VerticalProp = (
	GnomeVersion >= 48
	? { orientation: Clutter.Orientation.VERTICAL }
	: { vertical: true }
)

export function setVertical(actor: any, value: boolean) {
	if (GnomeVersion >= 48) {
		actor.orientation =
			value
			? Clutter.Orientation.VERTICAL
			: Clutter.Orientation.HORIZONTAL
	} else {
		actor.vertical = value
	}
}
