'use client'

import type { BreakpointId } from '@motion-studio/schema'
import { controlRowDotStyles } from '@motion-studio/ui'
import type { ReactElement } from 'react'

/**
 * The three states of a row — RESPONSIVE_ENGINE.md § Editing semantics. `overridden` is a value this
 * breakpoint sets itself, `inherited` is one it takes from a smaller one, and `base` is the
 * unconditional value, which carries no marker at all.
 */
export type OverrideState =
  | { readonly kind: 'base' }
  | { readonly kind: 'overridden'; readonly at: BreakpointId }
  | { readonly kind: 'inherited'; readonly from: BreakpointId }

export const BASE_STATE: OverrideState = { kind: 'base' }

/**
 * ADR-161: the one place the three states are put into English. The row shows this string in the
 * dot's `title` and again as the control's accessible description, so the visible marker and the one
 * a screen reader hears cannot drift apart.
 */
export function describeOverride(state: OverrideState): string | undefined {
  if (state.kind === 'overridden') {
    return `Overridden at ${state.at}`
  }

  if (state.kind === 'inherited') {
    return `Inherited from ${state.from}`
  }

  return undefined
}

export interface OverrideIndicatorProps {
  readonly state: OverrideState
}

/** The 4 px dot UI_GUIDELINES.md § Control rows reserves the gutter for. */
export function OverrideIndicator({ state }: OverrideIndicatorProps): ReactElement | null {
  const description = describeOverride(state)

  if (description === undefined) {
    return null
  }

  return (
    <span
      className={controlRowDotStyles({ tone: state.kind === 'overridden' ? 'accent' : 'muted' })}
      data-override={state.kind}
      title={description}
    />
  )
}
