'use client'

import type { ReactElement, ReactNode } from 'react'

export interface CompareTargetProps {
  readonly a: ReactNode
  readonly b: ReactNode
}

/**
 * The split target — PLAYGROUND.md § Compare mode. Same surface, same size, one down the middle,
 * which is how two shadow stacks are actually chosen between.
 *
 * Each half is the whole sandbox, clipped. Rendering half a target would give each side a different
 * box, and a value that reads differently at 320 px than at 640 px is exactly what this is for.
 */
export function CompareTarget({ a, b }: CompareTargetProps): ReactElement {
  return (
    <div className="relative h-full w-full" data-testid="compare-target">
      <div
        className="absolute inset-0"
        data-testid="compare-a"
        style={{ clipPath: 'inset(0 50% 0 0)' }}
      >
        {a}
      </div>
      <div
        className="absolute inset-0"
        data-testid="compare-b"
        style={{ clipPath: 'inset(0 0 0 50%)' }}
      >
        {b}
      </div>
      <div aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-border" />
      <span
        aria-hidden="true"
        className="absolute top-1 left-1 rounded-sm bg-surface-1/80 px-1 font-mono text-2xs text-foreground-muted"
      >
        A
      </span>
      <span
        aria-hidden="true"
        className="absolute top-1 right-1 rounded-sm bg-surface-1/80 px-1 font-mono text-2xs text-foreground-muted"
      >
        B
      </span>
    </div>
  )
}
