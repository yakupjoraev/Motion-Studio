import { cva } from 'class-variance-authority'

import { HEIGHT_CLASS } from '../styles/density'
import { FOCUS_RING, TRANSITION_CONTROL } from '../styles/variants'

export const collapsibleRootStyles = cva(['flex flex-col'])

/**
 * The trigger is a section header — § Section headers: 32 px, `text-xs`, uppercase, tracked out, muted, and
 * sticky when the panel scrolls. Stickiness lives here rather than at the call site so every section in every
 * panel behaves the same on scroll.
 */
export const collapsibleTriggerStyles = cva([
  'sticky top-0 z-10 flex w-full shrink-0 items-center gap-1.5 bg-surface-1 px-2',
  'font-medium text-2xs text-foreground-muted uppercase tracking-[0.06em]',
  'hover:text-foreground disabled:pointer-events-none disabled:opacity-50',
  HEIGHT_CLASS.sectionHeader,
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
