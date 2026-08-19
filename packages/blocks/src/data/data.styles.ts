import { cva } from 'class-variance-authority'

import type { Density } from './data.schema'

/**
 * The category's shared surface language: one focus ring, one transition, one plate, one row rhythm — so a
 * table beside a stat grid beside a timeline reads as one system rather than as three blocks that landed on
 * the same page.
 */
export const DATA_FOCUS =
  'focus-visible:outline-2 focus-visible:outline-accent-ring focus-visible:outline-offset-2'

/** Every duration is a token, so reduced motion collapses it — ADR-021, and why no number appears here. */
export const DATA_TRANSITION =
  'transition-[color,background-color,border-color,box-shadow,opacity] [transition-duration:var(--ms-duration-fast)] [transition-timing-function:var(--ms-ease-standard)]'

/**
 * The plate. A hairline and one step of surface rather than a shadow: DESIGN_SYSTEM.md § Elevation reserves
 * shadow for things that float, and a table inside a section does not.
 */
export const DATA_SURFACE = 'rounded-xl border border-border bg-surface-1'

/**
 * A scroller that a keyboard reader can reach. `overflow-x: auto` on its own container so a wide table
 * scrolls **inside the block** and the page never scrolls sideways, and the focus ring is the category's
 * because the element takes focus.
 */
export const DATA_SCROLLER = `relative w-full overflow-x-auto ${DATA_SURFACE} ${DATA_FOCUS}`

/** The row rhythm, shared by the table's cells and the timeline's items. */
export const DENSITY_PADDING: Readonly<Record<Density, string>> = {
  compact: 'px-3 py-2',
  default: 'px-4 py-3',
  comfortable: 'px-5 py-4',
}

export const DATA_HEADING = 'm-0 font-medium text-foreground text-md tracking-tight'

export const DATA_LABEL = 'm-0 text-base text-foreground-muted'

/**
 * A figure. `tabular-nums` is not decoration here: a column of proportional digits does not line up, and a
 * number that does not line up is a number the reader has to re-read.
 */
export const DATA_VALUE = 'm-0 font-semibold text-foreground tabular-nums tracking-tight'

/** What a block says when it has nothing to show. Muted, centred, and never an empty box. */
export const DATA_EMPTY = 'px-4 py-10 text-center text-base text-foreground-subtle'

/** `hidden` is a class rather than an early return, so a hidden block keeps its place in the tree. */
export const dataBlockStyles = cva('w-full', {
  variants: {
    hidden: { true: 'hidden', false: 'block' },
  },
})
