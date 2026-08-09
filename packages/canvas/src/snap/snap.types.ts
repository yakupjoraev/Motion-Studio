import type { NodeId } from '@motion-studio/schema'

import type { CanvasRect } from '../coords/index'

export type SnapAxis = 'x' | 'y'

/** CANVAS.md § Snapping, in priority order the other way up: `guide > center > edge > spacing > grid`. */
export type SnapKind = 'grid' | 'edge' | 'center' | 'guide' | 'spacing'

/** The three coordinates of the moving box a candidate can be matched against. */
export type SnapEdge = 'start' | 'center' | 'end'

/** The opening an equal-spacing candidate came from: `before` and `after` are the sibling edges. */
export interface SnapSpacing {
  readonly gap: number
  readonly before: number
  readonly after: number
}

export interface SnapCandidate {
  readonly axis: SnapAxis
  /** Canvas coordinate. */
  readonly value: number
  readonly kind: SnapKind
  readonly sourceId?: NodeId | undefined
  /** ADR-083. Absent means any of the three edges may match. */
  readonly edge?: SnapEdge | undefined
  /** Perpendicular extent of whatever produced the candidate — what bounds the drawn guide. */
  readonly from?: number | undefined
  readonly to?: number | undefined
  /** The value is the centre of whatever produced it, which is what renders dashed. */
  readonly centered?: boolean | undefined
  readonly spacing?: SnapSpacing | undefined
}

/** One measured gap, in canvas units, drawn as a bar with a number — CANVAS.md § Guides. */
export interface SnapGap {
  readonly axis: SnapAxis
  readonly start: number
  readonly end: number
  /** Position on the perpendicular axis: the centre of the moving box after the snap. */
  readonly cross: number
  readonly distance: number
}

export interface SnapGuide {
  readonly axis: SnapAxis
  readonly kind: SnapKind
  readonly value: number
  /** Perpendicular span of the alignment, before the 24 px of overhang the renderer adds. */
  readonly from: number
  readonly to: number
  readonly centered: boolean
  /** ADR-085: non-empty for a spacing snap, and then this guide draws bars instead of a line. */
  readonly gaps: readonly SnapGap[]
}

export interface SnapResult {
  readonly delta: { readonly x: number; readonly y: number }
  readonly guides: readonly SnapGuide[]
}

/** A guide the user dragged off a ruler. `axis: 'x'` is a vertical line at a constant x. */
export interface UserGuide {
  readonly id: string
  readonly axis: SnapAxis
  readonly value: number
}

export interface SnapBox {
  readonly id: NodeId
  readonly rect: CanvasRect
}

export interface SnapCandidateInput {
  /** The selection's bounding box at drag start — CANVAS.md § Snapping, not one box per node. */
  readonly moving: CanvasRect
  /** Visible siblings, with the moving nodes already removed by the caller. */
  readonly siblings: readonly SnapBox[]
  /** The parent's content box. */
  readonly container?: CanvasRect | undefined
  readonly guides?: readonly UserGuide[] | undefined
  /** Canvas units. Zero or absent produces no grid candidates. */
  readonly gridSize?: number | undefined
}

/**
 * ADR-087. The canvas holds no guide storage: the list comes in and the three intents go out, the
 * same seam `CanvasSelectionPort` uses for selection.
 */
export interface CanvasGuidePort {
  readonly guides: readonly UserGuide[]
  add(axis: SnapAxis, value: number): void
  move(id: string, value: number): void
  remove(id: string): void
}
