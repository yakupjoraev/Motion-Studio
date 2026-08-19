import { cva } from 'class-variance-authority'

import { DATA_LABEL, DATA_SURFACE } from '../data.styles'

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
    /** The category's plate, for a chart that has to hold its own on a page rather than sit inside a band. */
    plate: { true: `${DATA_SURFACE} p-5 md:p-6`, false: '' },
  },
})

/**
 * The plot and its two axes, as one grid: a column for the value scale and a row under the plot for the point names.
 * `auto` rather than a fixed width, so a three-digit tick is not clipped and a one-digit tick wastes no gutter.
 */
export const CHART_LAYOUT = 'grid grid-cols-[auto_1fr] items-stretch gap-x-3'

/** The value scale column. The same height as the plot, with its three ticks spread across it. */
export const CHART_VALUE_AXIS = 'flex flex-col justify-between text-right'

export const CHART_AXIS_TEXT = 'text-foreground-subtle text-xs tabular-nums'

/**
 * A tick sits *on* its line. `justify-between` leaves the first and last boxes half a line-height inside the ends of
 * the column, so those two are pulled back by exactly that and the middle one needs nothing.
 */
export const CHART_TICK = 'whitespace-nowrap first:-translate-y-1/2 last:translate-y-1/2'

/** The gridlines. `border` rather than `border-subtle`: a scale a reader cannot see is not a scale. */
export const CHART_GRID_LINE = 'text-border'

export const pointAxisStyles = cva('col-start-2 mt-2 flex w-full', {
  variants: {
    kind: {
      // A line's first and last vertices sit on the edges of the plot, so their labels align to the ends.
      line: 'justify-between',
      area: 'justify-between',
      // A bar occupies a slot, so its label is centred in an equal share of the width.
      bar: '',
    },
  },
})

export const pointLabelStyles = cva('', {
  variants: {
    kind: {
      line: 'shrink-0',
      area: 'shrink-0',
      bar: 'min-w-0 flex-1 text-center',
    },
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
