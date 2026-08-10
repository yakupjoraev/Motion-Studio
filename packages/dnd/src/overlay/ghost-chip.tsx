'use client'

import type { ReactNode } from 'react'

export interface GhostChipProps {
  readonly children: ReactNode
  readonly testId?: string
}

/** The same chip the canvas puts under a selection outline, so a ghost reads as one of the family. */
export function GhostChip({ children, testId }: GhostChipProps) {
  return (
    <span
      className="max-w-[160px] truncate rounded-xs bg-accent px-1 py-px text-2xs text-canvas-bg leading-[1.4]"
      data-testid={testId}
    >
      {children}
    </span>
  )
}
