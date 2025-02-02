import St from "gi://St"
import Clutter from "gi://Clutter"

export class Drag extends St.Bin {
	_dragging: boolean
	_dragIsClick: boolean
	_dragStartCoords: Drag.Coords
	_grab: Clutter.Grab
	_grabbedDevice: Clutter.InputDevice
	_grabbedSequence: Clutter.EventSequence
	dfunc_drag_end: (event: Drag.Event)=>void
	dfunc_drag_start: (event: Drag.Event)=>void
	dfunc_drag_motion: (event: Drag.Event)=>void

	_dragStart(event: Clutter.Event): boolean {
		if (this._dragging) return Clutter.EVENT_PROPAGATE
		this._dragging = true
		this._dragIsClick = true
		this._dragStartCoords = event.get_coords()
		this._grabbedDevice = event.get_device()
		this._grabbedSequence = event.get_event_sequence()

		// @ts-expect-error
		this._grab = global.stage.grab(this)

		const dragEvent: Drag.Event = event as Drag.Event
		dragEvent.isClick = true
		dragEvent.startCoords = this._dragStartCoords
		dragEvent.coords = this._dragStartCoords
		if (this.dfunc_drag_start) this.dfunc_drag_start(dragEvent)

		return Clutter.EVENT_STOP
	}
	_dragEnd(event: Clutter.Event): boolean {
		if (!this._dragging) {
			return Clutter.EVENT_PROPAGATE
		}

		if (this._grab) {
			this._grab.dismiss()
			this._grab = null
		}

		this._grabbedSequence = null
		this._grabbedDevice = null
		this._dragging = false

		const coords = event.get_coords()
		this._checkDragIsClick(coords)

		const dragEvent: Drag.Event = event as Drag.Event
		dragEvent.isClick = this._dragIsClick
		dragEvent.startCoords = this._dragStartCoords
		dragEvent.coords = coords
		if (this.dfunc_drag_end) this.dfunc_drag_end(dragEvent)
		return Clutter.EVENT_STOP
	}
	_dragMotion(event: Clutter.Event): boolean {
		const coords = event.get_coords()
		this._checkDragIsClick(coords)

		const dragEvent: Drag.Event = event as Drag.Event
		dragEvent.isClick = this._dragIsClick
		dragEvent.startCoords = this._dragStartCoords
		dragEvent.coords = coords
		if (this.dfunc_drag_motion) this.dfunc_drag_motion(dragEvent)
		return Clutter.EVENT_STOP
	}
	_checkDragIsClick(coords: Drag.Coords) {
		if (!this._dragIsClick) return
		if (
			Drag.getCoordsDistanceSquare(
				coords, this._dragStartCoords
			) > Drag.DragMinPixel
		) {
			this._dragIsClick = false
		}
	}

	vfunc_button_press_event(event: Clutter.Event): boolean {
		return this._dragStart(event)
	}

	vfunc_button_release_event(event: Clutter.Event): boolean {
		return this._dragEnd(event)
	}

	vfunc_touch_event(event: Clutter.Event): boolean {
		const sequence = event.get_event_sequence()
		const slotSame = this._grabbedSequence && sequence.get_slot() === this._grabbedSequence.get_slot()

		switch (event.type()) {
			case Clutter.EventType.TOUCH_BEGIN:
				return this._dragStart(event)
			case Clutter.EventType.TOUCH_UPDATE:
				if (!slotSame) return Clutter.EVENT_PROPAGATE
				return this._dragMotion(event)
			case Clutter.EventType.TOUCH_END:
				if (!slotSame) return Clutter.EVENT_PROPAGATE
				return this._dragEnd(event)
		}

		return Clutter.EVENT_PROPAGATE;
	}

	vfunc_motion_event(event: Clutter.Event): boolean {
		if (this._dragging && !this._grabbedSequence) {
			return this._dragMotion(event)
		}
		return Clutter.EVENT_PROPAGATE
	}

	static applyTo(widgetClass: any) {
		const widgetProto = widgetClass.prototype
		const dragProto = Drag.prototype
		for (const methodName of Object.getOwnPropertyNames(dragProto)) {
			Object.defineProperty(widgetProto, methodName, {
				value: dragProto[methodName],
				configurable: true,
				writable: true,
			})
		}
	}
	static getCoordsDistanceSquare(coordsA: Drag.Coords, coordsB: Drag.Coords): number {
		const [ax, ay] = coordsA
		const [bx, by] = coordsB
		const xdist = ax - bx
		const ydist = ay - by
		return xdist*xdist + ydist*ydist
	}
}
export namespace Drag {
	export const DragMinPixel = 6*6
	export type Coords = [number, number]
	export type Event = Clutter.Event & {
		isClick: boolean,
		startCoords: Coords,
		coords: Coords,
	}
}
