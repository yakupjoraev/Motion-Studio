import { round } from '@motion-studio/utils'
import type { RefObject } from 'react'

import type { ViewportTransform } from '../../coords/index'
import { GUIDE_OVERHANG_PX } from '../snap.constants'
import type { SnapAxis, SnapGap, SnapGuide, SnapResult } from '../snap.types'

/** Written at frame rate, read by the guide's own style rule. Element-scoped, so both lines share them. */
export const SNAP_VARS = {
  pos: '--ms-snap-pos',
  start: '--ms-snap-start',
  size: '--ms-snap-size',
} as const

export const GAP_VARS = {
  x: '--ms-gap-x',
  y: '--ms-gap-y',
  width: '--ms-gap-w',
  height: '--ms-gap-h',
} as const

export interface SnapGapSlot {
  readonly id: string
  readonly bar: RefObject<HTMLDivElement | null>
  readonly label: RefObject<HTMLSpanElement | null>
}

export interface SnapOverlay {
  readonly lines: Readonly<Record<SnapAxis, RefObject<HTMLDivElement | null>>>
  readonly gaps: readonly SnapGapSlot[]
}

/**
 * Canvas units to pixels inside the overlay layer. The layer is `inset-0` on the canvas root, so this
 * is `canvasToScreen` with the root's own offset already subtracted — CANVAS.md § Coordinate spaces.
 */
const local = (value: number, axis: SnapAxis, transform: ViewportTransform): number =>
  (value + (axis === 'x' ? transform.pan.x : transform.pan.y)) * transform.zoom

/**
 * One pass over a fixed pool of elements: two lines and four gap bars, shown by an attribute rather
 * than created on the frame the snap fires. Nothing here is React state — CANVAS.md § Overlays.
 */
export function paintSnap(
  overlay: SnapOverlay,
  result: SnapResult,
  transform: ViewportTransform,
): void {
  for (const axis of ['x', 'y'] as const) {
    // ADR-085: a spacing guide carries gaps and draws no line.
    const guide = result.guides.find((one) => one.axis === axis && one.gaps.length === 0)

    paintLine(overlay.lines[axis].current, guide, transform)
  }

  const gaps = result.guides.flatMap((guide) => guide.gaps)

  overlay.gaps.forEach((slot, index) => {
    paintGap(slot, gaps[index], transform)
  })
}

/** Clears every element, which is what a drop and a held `Cmd` both come to. */
export function clearSnap(overlay: SnapOverlay): void {
  paintSnap(overlay, { delta: { x: 0, y: 0 }, guides: [] }, { zoom: 1, pan: { x: 0, y: 0 } })
}

function paintLine(
  element: HTMLDivElement | null,
  guide: SnapGuide | undefined,
  transform: ViewportTransform,
): void {
  if (element === null) {
    return
  }

  if (guide === undefined) {
    element.removeAttribute('data-active')

    return
  }

  const cross = guide.axis === 'x' ? 'y' : 'x'

  element.style.setProperty(SNAP_VARS.pos, `${local(guide.value, guide.axis, transform)}px`)
  element.style.setProperty(
    SNAP_VARS.start,
    `${local(guide.from, cross, transform) - GUIDE_OVERHANG_PX}px`,
  )
  element.style.setProperty(
    SNAP_VARS.size,
    `${(guide.to - guide.from) * transform.zoom + GUIDE_OVERHANG_PX * 2}px`,
  )
  element.dataset['dashed'] = String(guide.centered)
  element.setAttribute('data-active', 'true')
}

function paintGap(slot: SnapGapSlot, gap: SnapGap | undefined, transform: ViewportTransform): void {
  const element = slot.bar.current

  if (element === null) {
    return
  }

  if (gap === undefined) {
    element.removeAttribute('data-active')

    return
  }

  const length = (gap.end - gap.start) * transform.zoom
  const along = local(gap.start, gap.axis, transform)
  const cross = local(gap.cross, gap.axis === 'x' ? 'y' : 'x', transform)

  element.style.setProperty(GAP_VARS.x, `${gap.axis === 'x' ? along : cross}px`)
  element.style.setProperty(GAP_VARS.y, `${gap.axis === 'x' ? cross : along}px`)
  element.style.setProperty(GAP_VARS.width, `${gap.axis === 'x' ? length : 1}px`)
  element.style.setProperty(GAP_VARS.height, `${gap.axis === 'x' ? 1 : length}px`)
  element.dataset['axis'] = gap.axis
  element.setAttribute('data-active', 'true')

  if (slot.label.current !== null) {
    // Canvas units, which is what the user typed into the inspector — not the zoomed pixels.
    slot.label.current.textContent = String(round(gap.distance, 2))
  }
}
