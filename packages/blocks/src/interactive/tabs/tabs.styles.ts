import { cva } from 'class-variance-authority'

import { INTERACTIVE_FOCUS, INTERACTIVE_TRANSITION } from '../interactive.styles'

/** The two custom properties the indicator is drawn from — ADR-203. Written by the component. */
export const TABS_COUNT_VARIABLE = '--ms-tabs-count'
export const TABS_INDEX_VARIABLE = '--ms-tabs-index'

export const tabsRootStyles = cva('w-full min-w-0 gap-6', {
  variants: {
    orientation: { horizontal: 'flex flex-col', vertical: 'flex flex-col md:flex-row md:gap-8' },
    hidden: { true: 'hidden', false: 'flex' },
  },
  defaultVariants: { orientation: 'horizontal', hidden: false },
})

/**
 * The frame the indicator is positioned against. It is exactly the list's box, which is why the indicator
 * can be a percentage of it, and it carries the rule the tabs sit on — a hairline rather than a border on
 * each trigger, so the row reads as one edge.
 */
export const tabsListFrameStyles = cva('relative min-w-0', {
  variants: {
    orientation: {
      horizontal: 'border-border border-b',
      vertical: 'border-border border-l',
    },
    align: { stretch: 'w-full', start: 'w-full md:w-fit', center: 'w-full md:mx-auto md:w-fit' },
  },
  defaultVariants: { orientation: 'horizontal', align: 'stretch' },
})

/**
 * Equal columns, and that is the whole mechanism: `repeat(var(--ms-tabs-count), minmax(0, 1fr))` makes every
 * trigger exactly `100 / n` per cent of the list, so the indicator's width and its travel are both
 * percentages and neither needs a layout read (ADR-203). `fr` rows equalise the same way in a grid whose
 * height is its content, which is what makes the vertical case the same arithmetic on the other axis.
 */
export const tabsListStyles = cva('grid min-w-0', {
  variants: {
    orientation: {
      horizontal: 'grid-cols-[repeat(var(--ms-tabs-count),minmax(0,1fr))]',
      vertical: 'grid-rows-[repeat(var(--ms-tabs-count),minmax(0,1fr))]',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
})

export const tabTriggerStyles = cva(
  [
    'relative inline-flex min-w-0 items-center gap-2 px-4 py-3 font-medium text-base text-foreground-muted',
    INTERACTIVE_TRANSITION,
    INTERACTIVE_FOCUS,
    'hover:text-foreground',
    // Weight as well as colour, so the selected tab is not carried by hue alone.
    'data-[state=active]:font-semibold data-[state=active]:text-foreground',
  ].join(' '),
  {
    variants: {
      orientation: { horizontal: 'justify-center', vertical: 'justify-start text-left' },
    },
    defaultVariants: { orientation: 'horizontal' },
  },
)

/**
 * The indicator. One element, translated by whole multiples of its own width, and the duration is a token so
 * reduced motion collapses the slide to a jump — the selected state is still carried by the trigger's weight
 * and by `aria-selected`, so nothing is lost when it stops moving.
 */
export const tabsIndicatorStyles = cva(
  [
    'pointer-events-none absolute rounded-full bg-accent',
    'transition-transform [transition-duration:var(--ms-duration-base)] [transition-timing-function:var(--ms-ease-standard)]',
  ].join(' '),
  {
    variants: {
      orientation: {
        horizontal:
          '-bottom-px left-0 h-0.5 w-[calc(100%/var(--ms-tabs-count))] translate-x-[calc(var(--ms-tabs-index)*100%)]',
        vertical:
          '-left-px top-0 h-[calc(100%/var(--ms-tabs-count))] w-0.5 translate-y-[calc(var(--ms-tabs-index)*100%)]',
      },
    },
    defaultVariants: { orientation: 'horizontal' },
  },
)

/** Radix gives the panel `tabindex="0"`, so it is a focus stop and needs the ring drawn on it. */
export const TABS_PANEL = ['min-w-0 flex-1 rounded-md', INTERACTIVE_FOCUS].join(' ')
