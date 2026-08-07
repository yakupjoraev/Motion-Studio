import { type VariantProps, cva } from 'class-variance-authority'

import { HEIGHT_CLASS } from '../styles/density'
import { FOCUS_RING, TRANSITION_CONTROL } from '../styles/variants'

/** `surface-inset` so the group reads as a well the indicator sits inside. */
export const segmentedRootStyles = cva([
  'relative inline-flex items-center gap-0.5 rounded-sm border border-border bg-surface-inset p-0.5',
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

/** One step of value above the inset track, which is the whole effect. */
export const segmentedIndicatorStyles = cva([
  'absolute inset-y-0.5 z-0 rounded-xs border border-border-strong bg-surface-2',
])

export type SegmentedStyleProps = VariantProps<typeof segmentedItemStyles>
