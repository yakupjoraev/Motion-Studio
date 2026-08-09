import type { Rect } from '@motion-studio/utils'

import type { SnapAxis, SnapEdge } from './snap.types'

export const AXES: readonly SnapAxis[] = ['x', 'y']

export const EDGES: readonly SnapEdge[] = ['start', 'center', 'end']

/**
 * A rect read along one axis. Every rule in this module — grid multiples, sibling edges, equal
 * spacing — is the same rule on both axes, and this is what lets it be written once instead of
 * twice with `x`/`width` swapped for `y`/`height` in the second copy.
 */
export interface AxisView {
  readonly start: number
  readonly size: number
  readonly end: number
  readonly center: number
  /** The perpendicular axis, which is what bounds a guide line. */
  readonly crossStart: number
  readonly crossEnd: number
}

export function axisView(rect: Rect, axis: SnapAxis): AxisView {
  const start = axis === 'x' ? rect.x : rect.y
  const size = axis === 'x' ? rect.width : rect.height
  const crossStart = axis === 'x' ? rect.y : rect.x
  const crossSize = axis === 'x' ? rect.height : rect.width

  return {
    start,
    size,
    end: start + size,
    center: start + size / 2,
    crossStart,
    crossEnd: crossStart + crossSize,
  }
}

export function edgeValue(view: AxisView, edge: SnapEdge): number {
  if (edge === 'start') {
    return view.start
  }

  return edge === 'center' ? view.center : view.end
}

export function overlaps(a: AxisView, b: AxisView): boolean {
  return a.crossStart < b.crossEnd && b.crossStart < a.crossEnd
}
