import { cva } from 'class-variance-authority'

import { DATA_LABEL } from '../data.styles'

/**
 * The figure, with a measure on it.
 *
 * `max-w-2xl` is not decoration and it is not a taste call: with `preserveAspectRatio="none"` the drawn slope is
 * decided entirely by the *container's* aspect, so a chart spanning 1 360 px at `h-32` is 10.6 : 1 and flattens
 * every series into a straight line. At the measure it is 5.25 : 1, which is the shape of a chart. Measured at
 * 1440 in both modes — the same defect ADR-211 recorded for panel prose, in a form that costs the data rather
 * than the reading.
 */
export const chartFrameStyles = cva('w-full max-w-2xl', {
  variants: {
    hidden: { true: 'hidden', false: 'block' },
  },
})

/**
 * The drawing. `preserveAspectRatio="none"` is what lets a fixed viewBox fill any width — the same call
 * `content/stat`'s sparkline makes, and the reason the stroke is `vectorEffect="non-scaling-stroke"`: without
 * it a stretched viewBox draws a line that is thicker vertically than horizontally.
 */
export const chartSvgStyles = cva('w-full', {
  variants: {
    height: {
      sm: 'h-20',
      md: 'h-32',
      lg: 'h-48',
    },
    tone: {
      accent: 'text-accent',
      success: 'text-success',
      warning: 'text-warning',
      danger: 'text-danger',
    },
  },
})

/** The area fill under the line. Low enough that the line stays the thing being read. */
export const CHART_AREA_OPACITY = '0.14'

export const CHART_CAPTION = `mt-3 mb-0 ${DATA_LABEL}`
