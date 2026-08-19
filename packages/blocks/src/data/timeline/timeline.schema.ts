import { z } from 'zod'

import { iconNameField } from '../../interactive/interactive.schema'
import {
  CAPTION_MAX_LENGTH,
  CELL_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  scrollRegionFields,
} from '../data.schema'

export const MAX_TIMELINE_ITEMS = 10
export const MIN_TIMELINE_ITEMS = 1

export const TIMELINE_ORIENTATIONS = ['vertical', 'horizontal'] as const

export type TimelineOrientation = (typeof TIMELINE_ORIENTATIONS)[number]

/** How the marker on the rail is drawn. A number is the step's position, not a prop. */
export const TIMELINE_MARKERS = ['dot', 'icon', 'number'] as const

export type TimelineMarkerKind = (typeof TIMELINE_MARKERS)[number]

export const timelineItemSchema = z.object({
  /**
   * The machine-readable value of the `<time datetime>` attribute — `2026-03`, `2026-03-18`, `2026-Q1` is
   * not one. It is the author's string and the block passes it through: a schema strict enough to reject a
   * week or a duration would reject valid HTML, and one loose enough to accept everything validates nothing.
   */
  date: z.string().max(LABEL_MAX_LENGTH).default(''),
  /** What the reader sees. Empty shows the machine value, which is better than showing nothing. */
  dateLabel: z.string().max(LABEL_MAX_LENGTH).default(''),
  title: z.string().min(1).max(CAPTION_MAX_LENGTH),
  /** Shown until a block is dropped into this step — ADR-206. */
  body: z.string().max(CELL_MAX_LENGTH).default(''),
  icon: iconNameField,
})

export type TimelineItem = z.infer<typeof timelineItemSchema>

const DEFAULT_ITEMS: readonly TimelineItem[] = [
  {
    date: '2026-01',
    dateLabel: 'January',
    title: 'The document model',
    body: 'A normalised tree, patches for history, and a file format with migrations.',
    icon: 'file',
  },
  {
    date: '2026-03',
    dateLabel: 'March',
    title: 'The canvas',
    body: 'Zoom, pan, snapping and overlays, with every node the component it will export as.',
    icon: 'layout-grid',
  },
  {
    date: '2026-05',
    dateLabel: 'May',
    title: 'Motion',
    body: 'Fifty-one presets on six channels, and one reduced-motion path through all of them.',
    icon: 'zap',
  },
  {
    date: '2026-08',
    dateLabel: 'August',
    title: 'The registry',
    body: 'Sixty-two blocks, each with a schema, controls, codegen and accessibility notes.',
    icon: 'grid',
  },
]

export const timelineSchema = z.object({
  items: z
    .array(timelineItemSchema)
    .min(MIN_TIMELINE_ITEMS)
    .max(MAX_TIMELINE_ITEMS)
    .default([...DEFAULT_ITEMS]),
  orientation: z.enum(TIMELINE_ORIENTATIONS).default('vertical'),
  marker: z.enum(TIMELINE_MARKERS).default('dot'),
  ...scrollRegionFields('Timeline'),
})

export type TimelineProps = z.infer<typeof timelineSchema>

/** What the reader sees on the date line. Never empty unless the author left both fields empty. */
export const dateText = (item: TimelineItem): string =>
  item.dateLabel.trim() === '' ? item.date : item.dateLabel
