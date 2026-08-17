'use client'

import { BREAKPOINTS } from '@motion-studio/schema'
import type { ReactElement } from 'react'

import { useStudioStore } from '../../../store/editor-store'

/**
 * The plain-language half of RESPONSIVE_ENGINE.md § Editing semantics' panel sketch. The segmented
 * control in the top bar says *which* breakpoint; this says what editing at it does, which is the
 * part users get wrong.
 *
 * Nothing is drawn at `base`: an unconditional value needs no reminder, and a line that is always
 * there is a line nobody reads.
 */
export function ResponsiveHeader(): ReactElement | null {
  const breakpoint = useStudioStore((state) => state.viewport.breakpoint)

  if (breakpoint === 'base') {
    return null
  }

  return (
    <p
      className="border-border border-b bg-surface-2/40 px-3 py-1.5 text-2xs text-foreground-muted"
      data-testid="responsive-header"
    >
      Editing <span className="font-medium text-foreground">{breakpoint}</span> and up ·{' '}
      {BREAKPOINTS[breakpoint].min} px and wider
    </p>
  )
}
