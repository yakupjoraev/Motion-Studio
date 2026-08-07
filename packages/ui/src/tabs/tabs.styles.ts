import { type VariantProps, cva } from 'class-variance-authority'

import { HEIGHT_CLASS } from '../styles/density'
import { FOCUS_RING, TRANSITION_CONTROL } from '../styles/variants'

export const tabsRootStyles = cva(['flex min-h-0 flex-col'])

/**
 * The panel tab strip: 36 px from § Density scale, with a hairline underneath so the strip reads as the top
 * edge of the panel rather than as a row of buttons floating on it.
 */
export const tabsListStyles = cva([
  'relative flex shrink-0 items-stretch gap-0 border-border border-b',
  HEIGHT_CLASS.tabStrip,
])

/**
 * The trigger carries no background in either state. The active tab is marked by the accent underline and by
 * the text climbing from `foreground-muted` to `foreground` — two carriers, so `ACCESSIBILITY.md`
 * § Non-negotiables 4 holds without a third.
 *
 * The accent is allowed here: § Character lists "active tab" among the four uses it permits, and a panel has
 * exactly one. That is the same count test ADR-032 applied to the state controls and got the other answer.
 */
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
 * The underline. One element moving between tabs rather than a border per trigger — § Timing calls a tab
 * indicator a layout animation, and two borders cross-fading is not one.
 *
 * `-bottom-px` puts it on top of the list's hairline instead of above it, so the strip keeps its 36 px.
 */
export const tabsIndicatorStyles = cva([
  'absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-accent',
])

/** Radix gives the panel `tabIndex={0}`, so it is a tab stop and needs the ring like anything else. */
export const tabsContentStyles = cva(['min-h-0 flex-1', FOCUS_RING])

export type TabsStyleProps = VariantProps<typeof tabsTriggerStyles>
