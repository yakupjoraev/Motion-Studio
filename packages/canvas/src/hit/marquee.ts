import type { NodeId } from '@motion-studio/schema'
import { contains, intersects } from '@motion-studio/utils'

import { type ScreenPoint, type ScreenRect, screenRect } from '../coords/index'
import type { RectCache } from '../rects/rect-cache'

/** CANVAS.md § Hit testing: intersect by default, contain while `Alt` is held. */
export type MarqueeMode = 'intersect' | 'contain'

/** Two corners in any order to a rect. The band is drawn in screen space, like every overlay. */
export function marqueeRect(from: ScreenPoint, to: ScreenPoint): ScreenRect {
  return screenRect({
    x: Math.min(from.x, to.x),
    y: Math.min(from.y, to.y),
    width: Math.abs(to.x - from.x),
    height: Math.abs(to.y - from.y),
  })
}

/**
 * Pure, and over the cache rather than the DOM — which is the whole reason the cache exists. A node
 * whose rect the cache does not hold is not a hit: ADR-079 makes that a one-frame absence rather
 * than a forced layout inside the gesture.
 *
 * `intersects` compares open interiors, so a band dragged up to a node's edge has not caught it yet
 * and a zero-area band catches nothing at all — a click on empty space clears rather than selects.
 */
export function marqueeHits(
  rect: ScreenRect,
  cache: RectCache,
  candidates: readonly NodeId[],
  mode: MarqueeMode,
): NodeId[] {
  const hits: NodeId[] = []

  for (const id of candidates) {
    const nodeRect = cache.get(id)

    if (nodeRect === undefined) {
      continue
    }

    if (mode === 'contain' ? contains(rect, nodeRect) : intersects(rect, nodeRect)) {
      hits.push(id)
    }
  }

  return hits
}
