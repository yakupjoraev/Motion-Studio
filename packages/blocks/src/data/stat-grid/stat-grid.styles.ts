import { cva } from 'class-variance-authority'

import type { Alignment } from '../../scales'
import { DATA_LABEL } from '../data.styles'

/**
 * The column ladder, stepping down so the grid is usable at 360 px without an override — the same ladder
 * `layout/grid` and `feature-grid` use, because a user who has learned one should not have to learn two.
 *
 * A function rather than a `cva` variant so the prop stays a plain integer: the schema guarantees the range,
 * and a lookup keyed by literals would need a cast at every call site to get back into it.
 */
export const columnsClass = (columns: number): string => {
  if (columns <= 2) {
    return 'grid-cols-1 @min-[640px]/frame:grid-cols-2'
  }

  if (columns === 3) {
    return 'grid-cols-1 @min-[640px]/frame:grid-cols-2 @min-[1024px]/frame:grid-cols-3'
  }

  return 'grid-cols-1 @min-[640px]/frame:grid-cols-2 @min-[1024px]/frame:grid-cols-4'
}

/**
 * The dividers are `gap-px` over a `border`-coloured plate, not `divide-x`.
 *
 * `divide-x` puts the rule on the cell, so it lands on the wrong edge as soon as the grid wraps to two rows
 * at `sm` — the first cell of the second row keeps a left rule it should not have. A one-pixel gap showing
 * the plate through it is correct at every column count the ladder above produces, and it is one class.
 *
 * The plate is written out rather than composed from `DATA_SURFACE`, and that is not a preference: that constant
 * carries `bg-surface-1`, and two `bg-*` utilities on one element are resolved by the order Tailwind emits them in
 * rather than the order they are written. Composed, the grid painted itself `surface-1` and every divider vanished
 * into it — measured at 1440 in light mode, which is where a white gap on a white plate is invisible.
 */
export const statGridStyles = cva('@container/frame grid list-none p-0', {
  variants: {
    dividers: {
      true: 'gap-px overflow-hidden rounded-xl border border-border bg-border',
      false: 'gap-6 bg-transparent',
    },
  },
})

export const statCellStyles = cva('@container flex min-w-0 flex-col', {
  variants: {
    dividers: {
      // Each cell repaints the plate, so the gap between them is the only place the border colour shows.
      true: 'bg-surface-1 p-5 @min-[768px]/frame:p-6',
      false: 'p-0',
    },
    align: {
      start: 'items-start text-left',
      center: 'items-center text-center',
      end: 'items-end text-right',
    } satisfies Record<Alignment, string>,
  },
})

/**
 * The value and the change sit side by side once the cell is wide enough for both, and stack when it is not.
 * This is the container query the capability declares (ADR-184): the same cell is wide in a two-column grid
 * and narrow in a four-column one at one viewport width, so a viewport query cannot tell them apart.
 */
export const STAT_CELL_HEAD =
  'flex flex-col gap-1 @[13rem]:flex-row @[13rem]:items-baseline @[13rem]:gap-3'

export const STAT_CELL_LABEL = `mt-2 ${DATA_LABEL}`
