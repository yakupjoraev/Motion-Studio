import { type VariantProps, cva } from 'class-variance-authority'

import { HEIGHT_CLASS } from '../styles/density'
import { FOCUS_RING, TRANSITION_CONTROL } from '../styles/variants'

/** `surface-inset` so the group reads as a well the indicator sits inside. */
export const segmentedRootStyles = cva([
  'group/segmented relative inline-flex items-center gap-0.5 rounded-sm border border-border bg-surface-inset p-0.5',
  HEIGHT_CLASS.controlRow,
])

/** No background of its own: a per-item one would disagree with the moving indicator mid-animation. */
export const segmentedItemStyles = cva(
  [
    'relative z-10 inline-flex items-center justify-center rounded-xs px-2 text-xs',
    TRANSITION_CONTROL,
    'disabled:pointer-events-none disabled:opacity-50',
    FOCUS_RING,
  ],
  {
    variants: {
      selected: {
        true: 'text-foreground',
        false: 'text-foreground-muted hover:text-foreground',
      },
    },
    defaultVariants: { selected: false },
  },
)

/**
 * One step of value above the inset track, which is the whole effect.
 *
 * Hidden until the root has measured a checked item, so it cannot flash at the left edge on the first
 * paint, and it only transitions once it is placed — `data-indicator` is that gate. The duration is
 * the theme's, so reduced motion zeroes it through the same variable everything else uses (ADR-021).
 */
export const segmentedIndicatorStyles = cva([
  'pointer-events-none absolute inset-y-0.5 left-0 z-0 hidden rounded-xs border border-border-strong bg-surface-2',
  'w-[var(--ms-segmented-w)] translate-x-[var(--ms-segmented-x)]',
  'group-data-[indicator=on]/segmented:block',
  '[transition:transform_var(--ms-duration-quick)_var(--ms-ease-standard),width_var(--ms-duration-quick)_var(--ms-ease-standard)]',
])

export type SegmentedStyleProps = VariantProps<typeof segmentedItemStyles>
