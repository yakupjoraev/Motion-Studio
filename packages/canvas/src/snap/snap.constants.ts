import type { SnapKind } from './snap.types'

/**
 * Screen pixels, converted to canvas units by the caller (`THRESHOLD_PX / zoom`), so the snap
 * engages at the same distance under the cursor at 25 % and at 400 % — CANVAS.md § Snapping.
 */
export const THRESHOLD_PX = 4

/** Ties at equal distance break by this order, highest first. */
export const PRIORITY: Record<SnapKind, number> = {
  guide: 5,
  center: 4,
  edge: 3,
  spacing: 2,
  grid: 1,
}

/** How far past the aligned edges a guide line runs, in screen pixels. */
export const GUIDE_OVERHANG_PX = 24

/**
 * A spacing snap measures two gaps per axis, and at most one snap engages per axis, so four labels
 * is the whole pool. The elements exist from mount and are shown by an attribute, because creating
 * them on the frame the snap fires would be a render in the middle of a gesture.
 */
export const GAP_LABEL_SLOTS = 4
