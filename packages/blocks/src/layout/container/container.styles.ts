import { cva } from 'class-variance-authority'

import type { ContainerProps } from './container.types'

/** Literal classes only — ADR-106. `gap` and `padding` share the space scale the section uses. */
export const containerStyles = cva('@container/frame w-full', {
  variants: {
    mode: { flex: 'flex', grid: 'grid' },
    columns: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 @min-[640px]/frame:grid-cols-2',
      3: 'grid-cols-1 @min-[640px]/frame:grid-cols-3',
      4: 'grid-cols-2 @min-[640px]/frame:grid-cols-4',
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

/**
 * The mode branch, in the one place both the component and the export read — ADR-249. Grid mode has
 * no direction and no wrap: the column count decides the flow, and passing both would emit two class
 * families that contradict each other.
 */
export const containerClassName = (props: ContainerProps): string =>
  props.mode === 'grid'
    ? containerStyles({
        mode: props.mode,
        columns: props.columns as 1 | 2 | 3 | 4,
        gap: props.gap,
        padding: props.padding,
        align: props.align,
        justify: props.justify,
        maxWidth: props.maxWidth,
        divide: props.divide,
        hidden: props.hidden,
      })
    : containerStyles({
        mode: props.mode,
        direction: props.direction,
        gap: props.gap,
        padding: props.padding,
        align: props.align,
        justify: props.justify,
        wrap: props.wrap,
        maxWidth: props.maxWidth,
        divide: props.divide,
        hidden: props.hidden,
      })
