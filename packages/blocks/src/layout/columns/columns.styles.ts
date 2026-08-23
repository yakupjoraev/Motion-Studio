import { cva } from 'class-variance-authority'

/**
 * One column below `md`, the split above it. The stacked form is a flex column so that
 * `reverseOnMobile` is one class rather than a second DOM order — the reading order stays the
 * document's, which is the point of making it a prop.
 */
export const columnsStyles = cva('flex flex-col md:grid', {
  variants: {
    split: {
      '1-1': 'md:grid-cols-2',
      '2-1': 'md:grid-cols-[2fr_1fr]',
      '1-2': 'md:grid-cols-[1fr_2fr]',
      '3-1': 'md:grid-cols-[3fr_1fr]',
      '1-3': 'md:grid-cols-[1fr_3fr]',
    },
    gap: {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-8',
      xl: 'gap-12',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    },
    reverseOnMobile: { true: 'flex-col-reverse md:flex-none', false: '' },
    hidden: { true: 'hidden', false: 'flex' },
  },
})

/** One cell of the pair. Named because the export writes the same two cells the component does. */
export const COLUMN_CELL = 'min-w-0'
