import { cva } from 'class-variance-authority'

/** Literal classes only — ADR-106. `gap` and `padding` share the space scale the section uses. */
export const containerStyles = cva('w-full', {
  variants: {
    mode: { flex: 'flex', grid: 'grid' },
    columns: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-3',
      4: 'grid-cols-2 sm:grid-cols-4',
    },
    direction: {
      row: 'flex-row',
      column: 'flex-col',
    },
    gap: {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-8',
      xl: 'gap-12',
    },
    padding: {
      none: 'p-0',
      xs: 'p-2',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-10',
      xl: 'p-14',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    },
    wrap: {
      true: 'flex-wrap',
      false: 'flex-nowrap',
    },
    maxWidth: {
      sm: 'max-w-screen-sm',
      md: 'max-w-screen-md',
      lg: 'max-w-screen-lg',
      xl: 'max-w-screen-xl',
      full: 'max-w-none',
    },
    divide: { true: 'divide-border', false: '' },
    hidden: { true: 'hidden', false: '' },
  },
  compoundVariants: [
    { direction: 'column', divide: true, class: 'divide-y' },
    { direction: 'row', divide: true, class: 'divide-x' },
  ],
})
