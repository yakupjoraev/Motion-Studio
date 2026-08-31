import { type VariantProps, cva } from 'class-variance-authority'

import { HEIGHT_CLASS } from '../styles/density'
import { FOCUS_RING, TRANSITION_CONTROL } from '../styles/variants'

export const tabsRootStyles = cva(['flex min-h-0 flex-col'])

/** The hairline underneath is what makes it a strip rather than a row of buttons. */
export const tabsListStyles = cva([
  'group/tabs relative flex shrink-0 items-stretch gap-0 border-border border-b',
  HEIGHT_CLASS.tabStrip,
])

/** No background in either state: the underline and the text weight are the two carriers. */
export const tabsTriggerStyles = cva(
  [
    'relative inline-flex items-center gap-1.5 whitespace-nowrap px-3 text-xs',
    'disabled:pointer-events-none disabled:opacity-50',
    TRANSITION_CONTROL,
    FOCUS_RING,
  ],
  {
    variants: {
      active: {
        true: 'text-foreground',
        false: 'text-foreground-muted hover:text-foreground',
      },
    },
    defaultVariants: { active: false },
  },
)

/**
 * Accent is permitted here: § Character lists "active tab", and a panel has one.
 *
 * Placed by the list rather than by the trigger, so there is one underline whatever the tab count.
 * Hidden until the list has measured an active trigger, and only transitioning once placed — a
 * `data-indicator` gate, so it cannot slide in from the left edge on the first paint. The duration is
 * the theme's, which is how reduced motion zeroes it (ADR-021).
 */
export const tabsIndicatorStyles = cva([
  'pointer-events-none absolute bottom-0 left-0 z-0 hidden h-[2px] rounded-full bg-accent',
  'w-[var(--ms-tabs-w)] translate-x-[var(--ms-tabs-x)]',
  'group-data-[indicator=on]/tabs:block',
  '[transition:transform_var(--ms-duration-quick)_var(--ms-ease-standard),width_var(--ms-duration-quick)_var(--ms-ease-standard)]',
])

/** Radix gives the panel `tabIndex={0}`, so it needs the ring. */
export const tabsContentStyles = cva(['min-h-0 flex-1', FOCUS_RING])

export type TabsStyleProps = VariantProps<typeof tabsTriggerStyles>
