import { cva } from 'class-variance-authority'

/** Literal classes — ADR-106. `divide-*` is why a stack exists next to a container. */
export const stackStyles = cva('flex', {
  variants: {
    direction: { vertical: 'flex-col', horizontal: 'flex-row' },
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
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    },
    divider: { true: 'divide-border', false: '' },
    hidden: { true: 'hidden', false: 'flex' },
  },
  compoundVariants: [
    // `divide-*` picks its axis from the direction, and the gap has to go with it: a divider between
    // two items that are eight pixels apart is a line floating in the gap.
    { direction: 'vertical', divider: true, class: 'divide-y' },
    { direction: 'horizontal', divider: true, class: 'divide-x' },
  ],
})
