import { cva } from 'class-variance-authority'

import { HEIGHT_CLASS } from '../styles/density'
import { FOCUS_RING, TRANSITION_CONTROL } from '../styles/variants'

export const collapsibleRootStyles = cva(['flex flex-col'])

/** A row rather than just the trigger: the section's `⟳` reset lives here, and a button in a button is not markup. */
export const collapsibleHeaderStyles = cva([
  'sticky top-0 z-10 flex shrink-0 items-center gap-1 bg-surface-1 pr-2',
  HEIGHT_CLASS.sectionHeader,
])

/** Fills the row, so clicking anywhere but the action toggles. */
export const collapsibleTriggerStyles = cva([
  'group flex h-full min-w-0 flex-1 items-center gap-1.5 px-2',
  'font-medium text-2xs text-foreground-muted uppercase tracking-[0.06em]',
  'hover:text-foreground disabled:pointer-events-none disabled:opacity-50',
  TRANSITION_CONTROL,
  FOCUS_RING,
])

/** Turns rather than swapping glyphs. */
export const collapsibleIndicatorStyles = cva([
  'shrink-0 text-foreground-subtle',
  'group-data-[state=open]:rotate-90',
  TRANSITION_CONTROL,
])

/** `overflow-hidden` is load-bearing: without it the content spills out at full height mid-animation. */
export const collapsibleContentStyles = cva(['overflow-hidden'])
