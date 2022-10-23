const { GObject, Clutter } = imports.gi

var PopupLayoutManager = GObject.registerClass(
  class PopupLayoutManager extends Clutter.LayoutManager {
    vfunc_allocate(container, box) {
      const childBox = new Clutter.ActorBox()

      let y = box.y1

      for (const child of container) {
        childBox.set_origin(0, y)

        const [, childNat] = child.get_preferred_height(-1)

        childBox.set_size(box.get_width(), childNat)

        y += childNat

        child.allocate(childBox)
      }
    }

    vfunc_get_preferred_width(container, _forHeight) {
      return this._getMaxChildWidth(container)
    }

    _getMaxChildWidth(container) {
      let [minWidth, natWidth] = [0, 0]

      for (const child of container) {
        const [childMin, childNat] = child.get_preferred_width(-1)
        minWidth = Math.max(minWidth, childMin)
        natWidth = Math.max(natWidth, childNat)
      }

      return [minWidth, natWidth]
    }

    vfunc_get_preferred_height(container, _forWidth) {
      let [minHeight, natHeight] = [0, 0]

      for (const child of container) {
        const [childMin, childNat] = child.get_preferred_height(-1)

        minHeight += childMin
        natHeight = childNat
      }

      return [minHeight, natHeight]
    }
  }
)
