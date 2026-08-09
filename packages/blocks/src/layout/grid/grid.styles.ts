import { cva } from 'class-variance-authority'

/**
 * Both grid modes are literal classes, which is what makes them export as themselves — ADR-116.
 * Explicit mode is `grid-cols-N`; auto-fit is the arbitrary value most builders do not offer, and
 * the four minimums are the card widths it is actually used for.
 */
export const gridStyles = cva('grid', {
  variants: {
    columns: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      5: 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-5',
      6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
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
