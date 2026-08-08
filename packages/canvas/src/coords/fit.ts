import { center } from '@motion-studio/utils'

import { FIT_PADDING, MAX_FIT_DOCUMENT_ZOOM, MAX_FIT_SELECTION_ZOOM } from './constants'
import type { CanvasRect, ViewportRect, ViewportTransform } from './coords.types'
import { clampZoom } from './zoom'

/**
 * The transform that puts `rect` in the middle of the viewport with `FIT_PADDING` screen pixels
 * around it. `maxZoom` is the rule that separates the two fits: the whole document stops at 1:1,
 * because magnifying a short page reads as a bug, and a selection stops at 200 %, because fitting a
 * 20 px icon would otherwise slam the canvas to its maximum.
 *
 * Padding is subtracted in **screen** space before the ratio, so it stays 64 px at every zoom.
 */
export function fitToRect(
  rect: CanvasRect,
  viewport: ViewportRect,
  maxZoom: number = MAX_FIT_DOCUMENT_ZOOM,
): ViewportTransform {
  const available = {
    width: viewport.width - FIT_PADDING * 2,
    height: viewport.height - FIT_PADDING * 2,
  }

  // A zero-width rect divides to `Infinity`, which `Math.min` drops in favour of `maxZoom`, and a
  // viewport too small to hold the padding gives a ratio the clamp floors at `MIN_ZOOM`.
  const zoom = clampZoom(
    Math.min(available.width / rect.width, available.height / rect.height, maxZoom),
  )

  const middle = center(rect)

  // The viewport's own offset cancels: its screen centre is `left + width / 2`, and so is the
  // screen position `canvasToScreen` computes for the rect's centre at this pan.
  return {
    zoom,
    pan: {
      x: viewport.width / (2 * zoom) - middle.x,
      y: viewport.height / (2 * zoom) - middle.y,
    },
  }
}

/** `Shift+2` — CANVAS.md § Zoom. Same maths, the other cap. */
export const fitToSelection = (rect: CanvasRect, viewport: ViewportRect): ViewportTransform =>
  fitToRect(rect, viewport, MAX_FIT_SELECTION_ZOOM)
