import { cva } from 'class-variance-authority'

import { MARKETING_FOCUS } from '../marketing.styles'

/**
 * The scroller. `overflow-x: auto` on its own container, so a wide matrix scrolls **inside the section**
 * and the page never scrolls sideways — which is the defect a comparison table causes on a phone more
 * reliably than any other block.
 *
 * `tabindex="0"` and a labelled `role="region"` make it reachable and scrollable from the keyboard: a
 * scrollable box that cannot take focus cannot be scrolled without a pointer.
 */
export const COMPARISON_SCROLLER = `relative w-full overflow-x-auto rounded-xl border border-border ${MARKETING_FOCUS}`

/**
 * `border-separate` with a zero spacing, not `border-collapse`, and that is what makes sticky work: a
 * collapsed table's borders belong to the table rather than to its cells, so a stuck cell travels without
 * its own edges and the header ends up with no line under it while it floats.
 */
export const COMPARISON_TABLE =
  'w-full min-w-[40rem] border-separate border-spacing-0 text-left text-base'

/**
 * The corner cell is stuck on **both** axes, which is why the z-index ladder has three rungs rather than
 * two: the corner (30) outranks the header row (20), which outranks the first column (10), which outranks
 * the ordinary cells. Any two of them sharing a value produces a cell that flickers under another while
 * scrolling diagonally.
 */
export const COMPARISON_CORNER =
  'sticky top-0 left-0 z-30 border-border border-r border-b bg-surface-1 px-4 py-4 font-semibold text-foreground'

export const comparisonHeadStyles = cva(
  'sticky top-0 z-20 border-border border-b bg-surface-1 px-4 py-4 text-center font-semibold',
  {
    variants: {
      highlighted: {
        // The accent *and* a heavier weight: the column the page is selling has to survive greyscale.
        true: 'text-accent',
        false: 'text-foreground',
      },
    },
  },
)

export const COMPARISON_ROW_HEAD =
  'sticky left-0 z-10 border-border-subtle border-r border-b bg-surface-0 px-4 py-3 font-normal text-foreground'

export const comparisonCellStyles = cva('border-border-subtle border-b px-4 py-3 text-center', {
  variants: {
    highlighted: {
      true: 'bg-accent-muted/30',
      false: '',
    },
  },
})

export const COMPARISON_TEXT = 'text-foreground-muted tabular-nums'

export const comparisonMarkStyles = cva(
  'inline-flex size-5 items-center justify-center rounded-full',
  {
    variants: {
      kind: {
        yes: 'bg-success-muted text-success',
        no: 'bg-surface-2 text-foreground-subtle',
      },
    },
  },
)

/** A hint under the table, for the reader who cannot see that it scrolls. */
export const COMPARISON_HINT = 'mt-3 mb-0 text-foreground-subtle text-base'
