'use client'

import type { ReactElement } from 'react'

import type { TargetProps } from './target.types'

/**
 * `clip-path` — a coloured block over a percentage grid. The grid is the tool: a polygon is written in
 * percentages, and a reader who can count the lines can read `50% 0%` off the shape instead of
 * guessing where the vertex went. Prompt 49 makes the vertices draggable; this is the surface it needs.
 */
const GRID =
  'bg-[length:10%_10%] bg-[linear-gradient(to_right,oklch(100%_0_0_/_0.1)_1px,transparent_1px),linear-gradient(to_bottom,oklch(100%_0_0_/_0.1)_1px,transparent_1px)]'

export function ClipPathTarget({ targetRef, initialStyle }: TargetProps): ReactElement {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-md bg-surface-2 p-6 [contain:paint]">
      <div className="relative h-full w-full">
        <div
          ref={targetRef}
          style={initialStyle}
          data-testid="playground-target"
          className="absolute inset-0 bg-[linear-gradient(140deg,oklch(62%_0.19_285),oklch(72%_0.16_200))]"
        />
        {/* Over the block, so the coordinates can be read off the shape rather than beside it. */}
        <div className={`pointer-events-none absolute inset-0 ${GRID}`} aria-hidden="true" />
      </div>
    </div>
  )
}
