import type { Rect } from '@motion-studio/utils'

import type { ViewportRect } from '../coords/index'

/** Screen pixels the scene has to move to bring a box inside the viewport. Zero on both axes means it is already there. */
export interface RevealPan {
  readonly dx: number
  readonly dy: number
}

/** One axis at a time: the two edges cannot both be out on the same side. */
function axis(
  start: number,
  size: number,
  viewStart: number,
  viewSize: number,
  pad: number,
): number {
  const near = viewStart + pad
  const far = viewStart + viewSize - pad

  if (start < near) {
    return near - start
  }

  if (start + size > far) {
    // A box taller or wider than the viewport is pulled to the near edge rather than the far one: the
    // top-left of a section is where its content starts, and that is the half worth showing.
    return Math.max(far - (start + size), near - start)
  }

  return 0
}

/**
 * The pan that brings a node's box into view, and no more than that — CANVAS.md § Pan. Zoom is
 * untouched, which is what separates this from `Shift+2`: an insertion that re-zoomed the canvas
 * would move everything the user was looking at to show them one new block.
 *
 * Both rects are screen pixels, which is the space the rect cache measures in.
 */
export function revealPan(rect: Rect, viewport: ViewportRect, padding: number): RevealPan {
  return {
    dx: axis(rect.x, rect.width, viewport.left, viewport.width, padding),
    dy: axis(rect.y, rect.height, viewport.top, viewport.height, padding),
  }
}
