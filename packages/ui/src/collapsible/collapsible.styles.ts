import { cva } from 'class-variance-authority'

import { HEIGHT_CLASS } from '../styles/density'
import { FOCUS_RING, TRANSITION_CONTROL } from '../styles/variants'

export const collapsibleRootStyles = cva(['flex flex-col'])

/**
 * The header row — § Section headers: 32 px, sticky while the panel scrolls. It is a row rather than just the
 * trigger because the section's `⟳` reset lives here too, and a button inside a button is not markup.
 *
 * Stickiness lives here rather than at the call site so every section in every panel behaves the same.
 */
export const collapsibleHeaderStyles = cva([
  'sticky top-0 z-10 flex shrink-0 items-center gap-1 bg-surface-1 pr-2',
  HEIGHT_CLASS.sectionHeader,
])

/** The trigger fills the row, so clicking anywhere but the action toggles the section. */
export const collapsibleTriggerStyles = cva([
  'group flex h-full min-w-0 flex-1 items-center gap-1.5 px-2',
  'font-medium text-2xs text-foreground-muted uppercase tracking-[0.06em]',
  'hover:text-foreground disabled:pointer-events-none disabled:opacity-50',
  TRANSITION_CONTROL,
  FOCUS_RING,
])

/** The chevron turns rather than swapping glyphs, so the open state is one object in two positions. */
export const collapsibleIndicatorStyles = cva([
  'shrink-0 text-foreground-subtle',
  'group-data-[state=open]:rotate-90',
  TRANSITION_CONTROL,
])

/**
 * `overflow-hidden` is what makes the height animation possible at all — without it the content spills out of
 * the collapsing box at full height and the animation looks like a wipe over nothing.
 *
 * The keyframes are in `styles/chrome.css`, keyed on `data-ms-collapsible`: they read Radix's measured
 * `--radix-collapsible-content-height`, and a CSS animation is also what Radix waits for before unmounting.
 */
export const collapsibleContentStyles = cva(['overflow-hidden'])
