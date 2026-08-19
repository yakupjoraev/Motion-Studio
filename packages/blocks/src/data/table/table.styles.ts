import { cva } from 'class-variance-authority'

import type { Alignment } from '../../scales'
import { DATA_FOCUS, DATA_TRANSITION, DENSITY_PADDING } from '../data.styles'

/**
 * `border-separate` with zero spacing, not `border-collapse`, and that is what makes the sticky header work:
 * a collapsed table's borders belong to the table rather than to its cells, so a stuck header travels without
 * its own edges and ends up floating with no line under it. `comparison-table` learned this first.
 */
export const TABLE_ELEMENT =
  'w-full min-w-[44rem] border-separate border-spacing-0 text-left text-base'

/**
 * Visible or not, the caption is always in the markup. `caption-side: bottom` when it shows, because a
 * heading above the plate would compete with the section heading above *that*, and a table's caption is a
 * legend rather than a title.
 */
export const captionStyles = cva('text-base', {
  variants: {
    visible: {
      true: 'caption-bottom px-4 py-3 text-left text-foreground-subtle',
      false: 'sr-only',
    },
  },
})

export const TEXT_ALIGN: Readonly<Record<Alignment, string>> = {
  start: 'text-left',
  center: 'text-center',
  end: 'text-right',
}

/**
 * The header cell. `z-20` when stuck, which is one rung above the zebra fill and below nothing — this table
 * has no sticky first column, so the ladder `comparison-table` needed three rungs for needs two here.
 */
export const headerCellStyles = cva(
  'border-border border-b bg-surface-1 font-semibold text-foreground',
  {
    variants: {
      sticky: { true: 'sticky top-0 z-20', false: '' },
      align: TEXT_ALIGN,
      density: DENSITY_PADDING,
    },
  },
)

/**
 * The sort control **is** the header, which is what the prompt asks for and what the pattern requires: a
 * separate button beside the label gives a reader two things to find where there is one action. It fills the
 * cell so the whole heading is the target, and it carries the category's focus ring because it takes focus.
 *
 * A right-aligned column reverses the row rather than pushing the content over, so the glyph stays beside the
 * label on the side the reader's eye is already on.
 */
export const sortButtonStyles = cva(
  [
    '-mx-2 -my-1 inline-flex w-[calc(100%+1rem)] items-center gap-1.5 rounded-md px-2 py-1',
    'cursor-pointer bg-transparent font-semibold text-inherit',
    DATA_TRANSITION,
    DATA_FOCUS,
    'hover:text-accent',
  ].join(' '),
  {
    /*
     * The control fills the cell, so it has to place its own content: a right-aligned column of figures under a
     * left-hugging heading reads as two columns. Measured at 1440, where the gap between "Nodes" and its numbers
     * was 200 px.
     */
    variants: {
      align: {
        start: 'justify-start',
        center: 'justify-center',
        end: 'flex-row-reverse justify-start',
      } satisfies Record<Alignment, string>,
    },
  },
)

/** Which way the column is sorted, as a glyph. `aria-hidden`: `aria-sort` on the cell is the announcement. */
export const sortGlyphStyles = cva('shrink-0', {
  variants: {
    state: {
      // An unsorted column keeps its glyph at low contrast rather than hiding it, so the affordance is
      // visible before the reader hovers — ACCESSIBILITY.md § Non-negotiables 10.
      none: 'text-foreground-subtle opacity-60',
      sorted: 'text-accent',
    },
  },
})

/**
 * `tabular-nums` on every cell rather than on the columns that look numeric: the block cannot tell a figure
 * from a version string, and a table where only some columns line up is worse than one where all of them do.
 */
export const bodyCellStyles = cva(
  'border-border-subtle border-b text-foreground-muted tabular-nums',
  {
    variants: {
      align: TEXT_ALIGN,
      density: DENSITY_PADDING,
    },
  },
)

/**
 * The zebra fill is `surface-2`, which is one step off the plate in both modes — the same relationship
 * either way, unlike a fixed grey, which is a stripe in one mode and a smudge in the other.
 */
export const bodyRowStyles = cva(DATA_TRANSITION, {
  variants: {
    zebra: { true: 'even:bg-surface-2', false: '' },
  },
})

/** The empty state lives in the body and spans every column, so the table keeps its shape while it waits. */
export const EMPTY_CELL = 'border-border-subtle border-b'
