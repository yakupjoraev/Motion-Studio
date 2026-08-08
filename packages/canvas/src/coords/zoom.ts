import { clamp } from '@motion-studio/utils'

import { MAX_ZOOM, MIN_ZOOM, ZOOM_QUANTUM } from './constants'
import { screenToCanvas } from './convert'
import type { ScreenPoint, ViewportRect, ViewportTransform } from './coords.types'

/** The zoom dropdown of CANVAS.md § Zoom. `Fit` and `Fill` are computed, not listed. */
export const ZOOM_STEPS: readonly number[] = [0.25, 0.5, 0.75, 1, 1.5, 2, 4]

/**
 * Bounds and quantisation in one place, because a zoom that skipped either would reach the store:
 * the bounds keep the scene usable, and the quantum keeps `Math.round(zoom * 100)` from reading
 * `99 %` at what the user set to `100 %`.
 */
export const clampZoom = (zoom: number): number => quantizeZoom(clamp(zoom, MIN_ZOOM, MAX_ZOOM))

export const quantizeZoom = (zoom: number): number => Math.round(zoom / ZOOM_QUANTUM) * ZOOM_QUANTUM

/**
 * CANVAS.md § Zoom. The new pan is **derived** from where the anchor sits in canvas units, never
 * adjusted by a delta: a delta carries its rounding error into the next gesture, and a hundred of
 * them is how a canvas wanders off. Zooming in and back out returns to the pan it started from.
 */
export function zoomAt(
  transform: ViewportTransform,
  factor: number,
  anchor: ScreenPoint,
  rect: ViewportRect,
): ViewportTransform {
  const zoom = clampZoom(transform.zoom * factor)
  const anchorCanvas = screenToCanvas(anchor, transform, rect)

  return {
    zoom,
    pan: {
      x: (anchor.x - rect.left) / zoom - anchorCanvas.x,
      y: (anchor.y - rect.top) / zoom - anchorCanvas.y,
    },
  }
}
