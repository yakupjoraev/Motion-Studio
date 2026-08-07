import type { ReactNode } from 'react'

/**
 * What a row hands the control it hosts — ADR-038. `id` and `labelledBy` both travel because a
 * `div`-based composite gets nothing from the row's `htmlFor`.
 */
export interface ControlSlotProps {
  readonly id: string
  readonly labelledBy: string
  readonly describedBy: string | undefined
  readonly mixed: boolean
}

/**
 * The contract every value control in the inspector honours — `STATE_MANAGEMENT.md` § Transient state.
 * `onChange` is what a gesture writes; `onCommit` is what becomes one history entry.
 */
export interface ValueControlProps<T> {
  readonly value: T
  /** Fires per animation frame during a continuous gesture, and once per discrete edit. */
  readonly onChange: (value: T) => void
  /** Fires once, on release. The consumer turns it into one coalesced command. */
  readonly onCommit: (value: T) => void
  /** The accessible name, used when the control is not hosted by a labelled row. */
  readonly label: string
  /**
   * The optional members carry `| undefined` explicitly. Under `exactOptionalPropertyTypes` that is what
   * lets a composite control forward a slot prop it may not have received, without a conditional spread
   * at every one of the twenty-odd call sites.
   */
  readonly id?: string | undefined
  /** The row's label element. Wins over `label` when present. */
  readonly labelledBy?: string | undefined
  readonly describedBy?: string | undefined
  readonly disabled?: boolean | undefined
  /** `UI_GUIDELINES.md` § Multi-selection: the selection disagrees on this property. */
  readonly mixed?: boolean | undefined
  readonly className?: string | undefined
}

export interface ControlRowProps {
  /** Sentence case, no colon — § Control rows. */
  readonly label: string
  readonly children: (slot: ControlSlotProps) => ReactNode
  /** The breakpoint this value was overridden at. Draws the accent dot and names the source. */
  readonly overriddenAt?: string
  /** Differs from the block's default. Shows the reset affordance without the dot. */
  readonly modified?: boolean
  readonly mixed?: boolean
  /** Absent means the value cannot be reset, and no reset affordance is drawn. */
  readonly onReset?: () => void
  readonly id?: string
  readonly className?: string
}
