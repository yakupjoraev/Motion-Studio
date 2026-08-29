'use client'

import dynamic from 'next/dynamic'
import type { ReactElement } from 'react'

/** The handles and the shape parameters ride with the sandbox that has them, not with the page. */
const ClipPathEditor = dynamic(
  () => import('../clip-path-editor/clip-path-editor').then((module) => module.ClipPathEditor),
  { ssr: false },
)

import type { TargetProps } from './target.types'

/**
 * `clip-path` — a coloured block over a percentage grid, with the vertices of its polygon on top of
 * it. The grid is what makes `50% 0%` readable off the shape; the handles are what make it editable.
 */
const GRID =
  'bg-[length:10%_10%] bg-[linear-gradient(to_right,oklch(100%_0_0_/_0.1)_1px,transparent_1px),linear-gradient(to_bottom,oklch(100%_0_0_/_0.1)_1px,transparent_1px)]'

export function ClipPathTarget({
  targetRef,
  initialStyle,
  value,
  onValueChange,
}: TargetProps): ReactElement {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-md bg-surface-2 p-6 pb-16 [contain:paint]">
      <div className="relative h-full w-full">
        <div
          ref={targetRef}
          style={initialStyle}
          data-testid="playground-target"
          className="absolute inset-0 bg-[linear-gradient(140deg,oklch(62%_0.19_285),oklch(72%_0.16_200))]"
        />
        {/* Over the block, so the coordinates can be read off the shape rather than beside it. */}
        <div className={`pointer-events-none absolute inset-0 ${GRID}`} aria-hidden="true" />
        <ClipPathEditor value={value} onValueChange={onValueChange} target={targetRef} />
      </div>
    </div>
  )
}
