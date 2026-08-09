import type { NodeId } from '@motion-studio/schema'

import type { CanvasRect, ViewportTransform } from '../coords/index'

/**
 * What one pass of the overlay loop hands every overlay. `dirty` separates the two kinds of frame
 * ADR-091 describes: a geometry pass, which is the only one that writes variables, and a pass where
 * nothing moved but the transform, which decides only what CSS cannot.
 */
export interface OverlayFrame {
  readonly transform: ViewportTransform
  readonly dirty: boolean
  /** The node's box in canvas units, or `undefined` while it has no measurement. */
  rect(id: NodeId): CanvasRect | undefined
}

export type OverlayPaint = (frame: OverlayFrame) => void

export interface OverlayPainter {
  /** Returns the un-register. Every overlay holds exactly one paint callback. */
  register(paint: OverlayPaint): () => void
  /** The geometry changed: re-measure, then paint. */
  invalidate(): void
  /** Only the transform changed. */
  schedule(): void
}
