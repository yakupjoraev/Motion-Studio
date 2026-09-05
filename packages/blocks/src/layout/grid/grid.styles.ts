import { cva } from 'class-variance-authority'

import { NARROW_SLIDER, NARROW_STACK } from '../../narrow-track'

import type { GridProps } from './grid.types'

/**
 * Both grid modes are literal classes, which is what makes them export as themselves — ADR-116.
 * Explicit mode is `grid-cols-N`; auto-fit is the arbitrary value most builders do not offer, and
 * the four minimums are the card widths it is actually used for.
 */
export const gridStyles = cva('@container/frame', {
  variants: {
    columns: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 @min-[640px]/frame:grid-cols-2',
      3: 'grid-cols-1 @min-[640px]/frame:grid-cols-2 @min-[1024px]/frame:grid-cols-3',
      4: 'grid-cols-1 @min-[640px]/frame:grid-cols-2 @min-[1024px]/frame:grid-cols-4',
      5: 'grid-cols-1 @min-[640px]/frame:grid-cols-3 @min-[1024px]/frame:grid-cols-5',
      6: 'grid-cols-2 @min-[640px]/frame:grid-cols-3 @min-[1024px]/frame:grid-cols-6',
    },
    /**
     * ADR-357, and here it is a prop rather than a default: this grid holds whatever a user put in it,
     * so only they know whether a swipe hides something. `slider` is still the default, because a
     * grid is most often used for cards and six of those stacked is the arrangement M15 rejected.
     */
    narrow: {
      stack: NARROW_STACK,
      slider: NARROW_SLIDER,
    },
    minItemWidth: {
      sm: 'grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]',
      md: 'grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]',
      lg: 'grid-cols-[repeat(auto-fit,minmax(20rem,1fr))]',
      xl: 'grid-cols-[repeat(auto-fit,minmax(24rem,1fr))]',
    },
    gapX: {
      none: 'gap-x-0',
      xs: 'gap-x-1',
      sm: 'gap-x-2',
      md: 'gap-x-4',
      lg: 'gap-x-8',
      xl: 'gap-x-12',
    },
    gapY: {
      none: 'gap-y-0',
      xs: 'gap-y-1',
      sm: 'gap-y-2',
      md: 'gap-y-4',
      lg: 'gap-y-8',
      xl: 'gap-y-12',
    },
    dense: { true: 'grid-flow-row-dense', false: '' },
    hidden: { true: 'hidden', false: 'grid' },
  },
})

/** The track branch, read by the component and by the export alike — ADR-249. */
export const gridClassName = (props: GridProps): string =>
  props.mode === 'auto-fit'
    ? gridStyles({
        narrow: props.narrow,
        minItemWidth: props.minItemWidth,
        gapX: props.gapX,
        gapY: props.gapY,
        dense: props.dense,
        hidden: props.hidden,
      })
    : gridStyles({
        narrow: props.narrow,
        columns: props.columns as 1 | 2 | 3 | 4 | 5 | 6,
        gapX: props.gapX,
        gapY: props.gapY,
        dense: props.dense,
        hidden: props.hidden,
      })
