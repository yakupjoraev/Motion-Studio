'use client'

import type { ReactElement } from 'react'

import type { ShapeUnit, TargetSize, Vertex } from './parse-polygon'
import { handlePosition } from './vertex-handle'

export interface EdgeHandleProps {
  readonly index: number
  readonly from: Vertex
  readonly to: Vertex
  readonly unit: ShapeUnit
  readonly size: TargetSize
  onInsert: (edge: number) => void
}

export const midpoint = (from: Vertex, to: Vertex): Vertex => ({
  x: (from.x + to.x) / 2,
  y: (from.y + to.y) / 2,
})

/**
 * The edge, as a button on its midpoint. A bare click target on the outline would be a `div` with an
 * `onClick` and no keyboard path; this is the same gesture with a name, a tab stop and an `Enter`.
 */
export function EdgeHandle({
  index,
  from,
  to,
  unit,
  size,
  onInsert,
}: EdgeHandleProps): ReactElement {
  return (
    <button
      type="button"
      aria-label={`Insert a vertex on edge ${index + 1}`}
      data-testid={`edge-handle-${index}`}
      onClick={() => onInsert(index)}
      style={handlePosition(midpoint(from, to), unit, size)}
      className="-translate-x-1/2 -translate-y-1/2 absolute grid size-5 place-items-center rounded-full border border-white/60 bg-surface-1/70 text-[10px] text-foreground opacity-0 transition-opacity [transition-duration:var(--ms-duration-fast)] hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-accent-ring focus-visible:outline-offset-2"
    >
      <span aria-hidden="true">+</span>
    </button>
  )
}
