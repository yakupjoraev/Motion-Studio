import { cva } from 'class-variance-authority'

import type { RingWeight } from './progress-ring.schema'

export const ringFrameStyles = cva('inline-flex flex-col items-center gap-3', {
  variants: {
    hidden: { true: 'hidden', false: 'inline-flex' },
  },
})

export const ringSvgStyles = cva('-rotate-90', {
  variants: {
    size: {
      sm: 'size-24',
      md: 'size-36',
      lg: 'size-48',
    },
  },
})

/**
 * How heavy the arc is, in the viewBox's own units. The track and the arc share the number, because a track
 * narrower than its arc reads as a shadow rather than as the space the arc has left to travel.
 */
export const RING_STROKE: Readonly<Record<RingWeight, number>> = {
  thin: 6,
  regular: 10,
  thick: 14,
}

/** `surface-inset` rather than `border`: the track is a well the arc sits in, and it inverts with the mode. */
export const RING_TRACK = 'text-surface-inset'

/**
 * The arc. `ms-ring-fill` is in `blocks.css`, where the keyframe and the reduced-motion rule live: the
 * element's own `stroke-dashoffset` is the **final** value and the keyframe only declares a `from`, so a
 * duration collapsed to zero leaves the ring at the value it is reporting rather than empty.
 */
export const RING_ARC = 'ms-ring-fill text-accent'

export const ringReadoutStyles = cva(
  'absolute inset-0 flex flex-col items-center justify-center font-semibold text-foreground tabular-nums tracking-tight',
  {
    variants: {
      size: {
        sm: 'text-xl',
        md: 'text-3xl',
        lg: 'text-4xl',
      },
    },
  },
)

export const RING_UNIT = 'font-medium text-foreground-muted text-base'

export const RING_CAPTION =
  'm-0 max-w-[14rem] text-balance text-center text-base text-foreground-muted'
