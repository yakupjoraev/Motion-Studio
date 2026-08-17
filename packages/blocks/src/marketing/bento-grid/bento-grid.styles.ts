import { cva } from 'class-variance-authority'

/**
 * Four tracks above `lg`, two above `sm`, one below it — so a cell that spans two columns spans half the
 * grid at every width where spanning means anything, and the whole composition becomes a stack at
 * 360 px without an override.
 *
 * **Gapless** is a one-pixel gap painted in the border colour, not a border on each cell. The
 * difference matters: borders on neighbouring cells double up into a two-pixel line wherever two cells
 * meet, and every trick for avoiding that (negative margins, nth-child rules, borders on two sides
 * only) breaks as soon as a cell spans. A painted gap is one declaration and it is correct for every
 * arrangement.
 */
export const bentoGridStyles = cva('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4', {
  variants: {
    gapless: {
      true: 'gap-px overflow-hidden rounded-2xl border border-border bg-border',
      false: 'gap-4',
    },
  },
})

export const bentoCellStyles = cva('@container flex min-w-0 flex-col overflow-hidden', {
  variants: {
    gapless: {
      // The corners belong to the panel, so a cell inside it has none of its own.
      true: 'rounded-none bg-surface-1',
      false: 'rounded-xl border border-border bg-surface-1 shadow-sm',
    },
    height: {
      sm: 'min-h-32',
      md: 'min-h-40',
      lg: 'min-h-56',
    },
  },
})

/**
 * The spans, as literal classes because Tailwind needs a literal (ADR-106), and only from `lg` up: at
 * one and two tracks a span is either meaningless or the full width already.
 */
export const COL_SPAN_CLASS = {
  1: '',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
} as const

export const ROW_SPAN_CLASS = {
  1: '',
  2: 'lg:row-span-2',
} as const

/** Cells hold placed blocks, so the padding is the cell's and the content is whatever went in it. */
export const BENTO_CELL_BODY = 'flex min-w-0 flex-1 flex-col gap-3 p-5 @sm:p-6'
