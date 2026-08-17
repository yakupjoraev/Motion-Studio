'use client'

import type { CanvasHandle, ViewportTransform } from '@motion-studio/canvas'
import type { NodeId } from '@motion-studio/schema'
import type { Rect } from '@motion-studio/utils'

/**
 * The one canvas of the studio, reachable from the panels — the same shape `layerRects` has, and for
 * the same reason: the palette lives in a different branch of the tree and cannot be handed a ref
 * through five components that have no business holding one.
 *
 * It holds a handle, not a canvas: everything a caller can do here is a method the canvas published.
 */
let current: CanvasHandle | null = null

export const setCanvasHandle = (handle: CanvasHandle | null): void => {
  current = handle
}

/**
 * Three frames, because an insertion has three of them to get through: the store's `set`, React's
 * commit that mounts the node, and the rect pass that measures it. `reveal` reports whether the node
 * was measured, so this stops on the first frame that finds it rather than panning three times.
 */
export const REVEAL_FRAMES = 3

export interface RevealOptions {
  /** Injected so a test can drive frames by hand; the default is the real frame. */
  readonly schedule?: (callback: () => void) => void
  readonly frames?: number
}

/**
 * The canvas half of the drag layer's geometry — `DragRectSource` over the live rect cache, so a
 * scene that pans mid-drag reports where its nodes are now rather than where they were at drag start.
 */
export const canvasRects = {
  get: (id: NodeId): Rect | undefined => current?.nodeRect(id),
  /** The live zoom, for the keyboard step of ADR-127. `undefined` before the canvas mounts. */
  transform: (): ViewportTransform | undefined => current?.transform(),
  panBy: (dx: number, dy: number): void => current?.panBy(dx, dy),
  /** ADR-183: a drag is the moment the rects have to be right, so it is the moment they are re-read. */
  remeasure: (): void => current?.remeasure(),
}

/** Nothing happens before the canvas has mounted, which is the same answer as a document with no canvas. */
export function revealNode(id: NodeId, options: RevealOptions = {}): void {
  const schedule = options.schedule ?? ((callback: () => void) => requestAnimationFrame(callback))
  let left = options.frames ?? REVEAL_FRAMES

  const attempt = (): void => {
    left -= 1

    if (current?.reveal(id) === true || left <= 0) {
      return
    }

    schedule(attempt)
  }

  attempt()
}
