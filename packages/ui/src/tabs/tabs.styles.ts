import { type VariantProps, cva } from 'class-variance-authority'

import { HEIGHT_CLASS } from '../styles/density'
import { FOCUS_RING, TRANSITION_CONTROL } from '../styles/variants'

export const tabsRootStyles = cva(['flex min-h-0 flex-col'])

/** The hairline underneath is what makes it a strip rather than a row of buttons. */
export const tabsListStyles = cva([
  'relative flex shrink-0 items-stretch gap-0 border-border border-b',
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

/** Accent is permitted here: § Character lists "active tab", and a panel has one. `-bottom-px` sits it on the list's hairline. */
export const tabsIndicatorStyles = cva([
  'absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-accent',
])

/** Radix gives the panel `tabIndex={0}`, so it needs the ring. */
export const tabsContentStyles = cva(['min-h-0 flex-1', FOCUS_RING])

export type TabsStyleProps = VariantProps<typeof tabsTriggerStyles>
