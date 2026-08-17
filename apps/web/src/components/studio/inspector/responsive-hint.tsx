'use client'

import { InfoIcon, XIcon } from '@motion-studio/icons'
import { Button } from '@motion-studio/ui'
import type { ReactElement } from 'react'

import { useStudioStore } from '../../../store/editor-store'

import { dismissResponsiveHint, useResponsiveHintVisible } from './use-responsive-edit'

/**
 * The guardrail of RESPONSIVE_ENGINE.md § Guardrail: a user who does not realise which breakpoint
 * they are editing fills a document with overrides they never meant to make, and finds out at export.
 *
 * One line, never a modal — it appears beside work in progress, and a dialog would make the mistake
 * it warns about cost a click to keep going. An `<output>` rather than a `div` with `role="status"`:
 * the element carries that role implicitly.
 */
export function ResponsiveHint(): ReactElement | null {
  const visible = useResponsiveHintVisible()
  const breakpoint = useStudioStore((state) => state.viewport.breakpoint)

  if (!visible || breakpoint === 'base') {
    return null
  }

  return (
    <output
      className="flex items-start gap-2 border-accent/30 border-b bg-accent-muted/40 px-3 py-2"
      data-testid="responsive-hint"
    >
      <InfoIcon className="mt-px shrink-0 text-accent" size={12} />
      <p className="flex-1 text-pretty text-2xs text-foreground-muted">
        You’re editing <span className="font-medium text-foreground">{breakpoint}</span> and up.
        Switch to base to change all sizes.
      </p>
      <Button aria-label="Dismiss hint" onClick={dismissResponsiveHint} size="icon" variant="ghost">
        <XIcon size={12} />
      </Button>
    </output>
  )
}
