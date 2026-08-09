import type { NodeSpacing } from '../canvas.types'
import { type CanvasRect, type ViewportTransform, canvasRect } from '../coords/index'

import { OVERLAY_VARS, SPACING_VARS } from './overlay.styles'

/** UI_GUIDELINES.md § Canvas presentation: `text-2xs` on one line, plus its padding. */
export const CHIP_HEIGHT_PX = 18

/** Below this the handles are smaller than the gap between them — CANVAS.md § Overlays. */
export const HANDLE_MIN_ZOOM = 0.4

/**
 * Writes the box and returns whether the element is showing. Four variables in canvas units; the
 * screen position is the `calc()` in `OVERLAY_BOX_STYLE` (ADR-091).
 */
export function writeBox(element: HTMLElement | null, rect: CanvasRect | undefined): boolean {
  if (element === null) {
    return false
  }

  if (rect === undefined) {
    element.removeAttribute('data-active')

    return false
  }

  element.style.setProperty(OVERLAY_VARS.x, `${rect.x}px`)
  element.style.setProperty(OVERLAY_VARS.y, `${rect.y}px`)
  element.style.setProperty(OVERLAY_VARS.width, `${rect.width}px`)
  element.style.setProperty(OVERLAY_VARS.height, `${rect.height}px`)
  element.setAttribute('data-active', 'true')

  return true
}

export function writeSpacing(element: HTMLElement | null, spacing: NodeSpacing): void {
  if (element === null) {
    return
  }

  for (const kind of ['padding', 'margin'] as const) {
    for (const side of ['top', 'right', 'bottom', 'left'] as const) {
      element.style.setProperty(SPACING_VARS[kind][side], `${spacing[kind][side]}px`)
    }
  }
}

/**
 * The chip sits above its box, and above the topmost box on screen there is nothing left to sit in.
 * The comparison is against the canvas root, which the overlay layer covers exactly.
 */
export function shouldFlipChip(
  rect: CanvasRect,
  transform: ViewportTransform,
  chipHeight: number = CHIP_HEIGHT_PX,
): boolean {
  return (rect.y + transform.pan.y) * transform.zoom < chipHeight
}

export function handlesVisible(zoom: number): boolean {
  return zoom >= HANDLE_MIN_ZOOM
}

/** The multi-selection box: what is included, stated as one rectangle. */
export function unionRect(rects: readonly CanvasRect[]): CanvasRect | undefined {
  const [first, ...rest] = rects

  if (first === undefined) {
    return undefined
  }

  let left = first.x
  let top = first.y
  let right = first.x + first.width
  let bottom = first.y + first.height

  for (const rect of rest) {
    left = Math.min(left, rect.x)
    top = Math.min(top, rect.y)
    right = Math.max(right, rect.x + rect.width)
    bottom = Math.max(bottom, rect.y + rect.height)
  }

  return canvasRect({ x: left, y: top, width: right - left, height: bottom - top })
}
