import { cva } from 'class-variance-authority'

import { DATA_FOCUS, DATA_LABEL } from '../data.styles'

/**
 * The list. Vertical is a column of rows; horizontal is a scroll-snap strip.
 *
 * The strip scrolls with `snap-x snap-mandatory` rather than with a carousel: touch, trackpad, keyboard and
 * screen readers all work without us, which is the same call `interactive/carousel` made and for the same
 * reason.
 */
export const timelineListStyles = cva('m-0 flex list-none p-0', {
  variants: {
    orientation: {
      vertical: 'flex-col',
      horizontal: 'snap-x snap-mandatory gap-6 overflow-x-auto pb-2',
    },
  },
})

/**
 * The frame. The horizontal strip takes focus, so it draws the category's ring; the vertical one scrolls with
 * the page and takes none. `hidden` lives here rather than on the list, so a hidden block hides its region too.
 */
export const timelineFrameStyles = cva('w-full', {
  variants: {
    orientation: {
      vertical: '',
      horizontal: `rounded-lg ${DATA_FOCUS}`,
    },
    hidden: { true: 'hidden', false: 'block' },
  },
})

export const timelineItemStyles = cva('relative', {
  variants: {
    orientation: {
      vertical: 'grid grid-cols-[auto_1fr] gap-x-4',
      // A fixed measure per step: a strip whose columns size to their content snaps to arbitrary widths.
      horizontal: 'flex min-w-[15rem] max-w-[18rem] shrink-0 snap-start flex-col gap-3',
    },
  },
})

/** The marker column in vertical mode, the marker row in horizontal. */
export const markerRailStyles = cva('flex', {
  variants: {
    orientation: {
      vertical: 'flex-col items-center',
      horizontal: 'flex-row items-center',
    },
  },
})

/**
 * The marker itself. `size-8` is the smallest circle a glyph and a two-digit number both fit in, and the
 * `surface-1` fill is what lets it sit on the rail without the line showing through.
 */
export const MARKER = [
  'z-10 inline-flex size-8 shrink-0 items-center justify-center rounded-full',
  'border border-border-strong bg-surface-1 font-medium text-accent text-xs tabular-nums',
].join(' ')

/** The dot inside the circle. Filled accent, so a step reads as a point on the rail rather than as a ring. */
export const MARKER_DOT = 'size-2.5 rounded-full bg-accent'

/** The rail. A hairline, and it runs *between* markers rather than past the last one. */
export const railStyles = cva('bg-border', {
  variants: {
    orientation: {
      vertical: 'my-1 w-px flex-1',
      horizontal: 'mx-1 h-px flex-1',
    },
  },
})

export const contentStyles = cva('flex min-w-0 flex-col', {
  variants: {
    orientation: {
      // The bottom padding is the gap between steps: putting it on the content rather than on the list is
      // what lets the rail run the full height of the row it belongs to.
      vertical: 'pb-8',
      horizontal: 'pb-0',
    },
  },
})

export const TIMELINE_DATE = `m-0 block font-medium ${DATA_LABEL}`

export const TIMELINE_TITLE = 'mt-1 mb-0 font-semibold text-foreground text-md'

export const TIMELINE_BODY = 'mt-2 mb-0 max-w-prose text-pretty text-base text-foreground-muted'
