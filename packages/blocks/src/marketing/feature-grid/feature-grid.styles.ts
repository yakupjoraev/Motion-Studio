import { cva } from 'class-variance-authority'

import { NARROW_SLIDER, NARROW_STACK } from '../../narrow-track'

/**
 * Two, three or four columns, stepping down so the grid is usable at 360 px without an override — the
 * same ladder `layout/grid` uses, because a user who has learned one should not have to learn two.
 *
 * The steps query `/frame`, the section's container (ADR-356). As viewport queries they held four
 * columns on a 375 px artboard — the grid was reading the 1920 px window around it, and each cell
 * came out ~50 px wide with one word per line.
 */
export const featureGridStyles = cva('list-none gap-6 p-0', {
  variants: {
    columns: {
      2: '@min-[640px]/frame:grid-cols-2',
      3: '@min-[640px]/frame:grid-cols-2 @min-[1024px]/frame:grid-cols-3',
      4: '@min-[640px]/frame:grid-cols-2 @min-[1024px]/frame:grid-cols-4',
    },
    narrow: {
      stack: NARROW_STACK,
      slider: NARROW_SLIDER,
    },
  },
})

/**
 * The cell is the container query's subject (`capabilities.containerQuery`, ADR-184): a three-column
 * grid at 1440 gives a cell ~420 px and the same grid at 768 gives it ~340, and the icon belongs beside
 * the text in the first case and above it in the second. A viewport query cannot tell those apart —
 * the same cell is wide in a two-column grid and narrow in a four-column one at one viewport width.
 */
export const FEATURE_CELL_CONTAINER = '@container'

export const FEATURE_CELL_BODY = 'flex flex-col gap-4 p-6 @sm:flex-row @sm:items-start @sm:gap-5'

/** The icon plate keeps its size in both arrangements; only where it sits changes. */
export const FEATURE_CELL_TEXT = 'flex min-w-0 flex-col'

export const FEATURE_TITLE = 'm-0 font-semibold text-foreground text-lg'

/**
 * `md` (16 px), not `sm`. DESIGN_SYSTEM.md § Typography puts the studio's own base at 14 px and page body
 * at 16, and a feature cell is page body — 12 px here measured as a cell nobody reads twice.
 */
export const FEATURE_BODY = 'mt-2 mb-0 text-pretty text-foreground-muted text-md'
