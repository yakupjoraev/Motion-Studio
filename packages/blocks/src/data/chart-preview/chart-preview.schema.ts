import { z } from 'zod'

import {
  CELL_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  MAX_SERIES_POINTS,
  SUMMARY_MAX_LENGTH,
  dataFrameFields,
  seriesField,
} from '../data.schema'

export const CHART_KINDS = ['line', 'area', 'bar'] as const

export type ChartKind = (typeof CHART_KINDS)[number]

/** Which semantic colour the chart is drawn in. A tone, not a colour: the theme owns the value. */
export const CHART_TONES = ['accent', 'success', 'warning', 'danger'] as const

export type ChartTone = (typeof CHART_TONES)[number]

export const CHART_HEIGHTS = ['sm', 'md', 'lg'] as const

export type ChartHeight = (typeof CHART_HEIGHTS)[number]

export const chartPreviewSchema = z.object({
  series: seriesField.default([12, 28, 24, 46, 62, 84]),
  /**
   * One name per point, for the hidden table. Fewer names than points is legal — the table falls back to the
   * point's position, which is more useful than an empty row header.
   */
  labels: z
    .array(z.string().max(LABEL_MAX_LENGTH))
    .max(MAX_SERIES_POINTS)
    .default(['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']),
  kind: z.enum(CHART_KINDS).default('area'),
  tone: z.enum(CHART_TONES).default('accent'),
  height: z.enum(CHART_HEIGHTS).default('md'),
  /** What the series is. Used in the computed summary and as the table's value column heading. */
  seriesLabel: z.string().min(1).max(LABEL_MAX_LENGTH).default('Exports per week'),
  /**
   * What a screen reader hears instead of the drawing. Empty computes the direction and the ends, which is the
   * comparison the chart exists to make; write your own when the series needs prose.
   */
  summary: z.string().max(SUMMARY_MAX_LENGTH).default(''),
  /**
   * The real values, as a visually hidden table. On by default: a chart a screen reader cannot convey is
   * decoration, and this is what turns the summary into data the reader can check.
   */
  showTable: z.boolean().default(true),
  /**
   * The value scale: three labelled gridlines beside the plot. A chart whose values can only be guessed from the
   * shape is a decoration, and the ends of the range are the two numbers a reader wants first.
   */
  showGrid: z.boolean().default(true),
  /** The point names under the plot. Without this the `labels` prop is visible only to a screen reader. */
  showPointLabels: z.boolean().default(true),
  /** The category's plate around the whole figure, for a chart that is not already inside a band. */
  plate: z.boolean().default(false),
  caption: z.string().max(CELL_MAX_LENGTH).default(''),
  ...dataFrameFields(),
})

export type ChartPreviewProps = z.infer<typeof chartPreviewSchema>

/** The row header for a point. The author's name, or its position when they gave fewer names than points. */
export const pointLabel = (labels: readonly string[], index: number): string => {
  const label = labels[index]?.trim() ?? ''

  return label === '' ? `Point ${index + 1}` : label
}
