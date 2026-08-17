import { z } from 'zod'

import {
  HREF_MAX_LENGTH,
  MARQUEE_MAX_DURATION,
  MARQUEE_MIN_DURATION,
  TESTIMONIAL_ATTRIBUTION_MAX_LENGTH,
  TESTIMONIAL_QUOTE_MAX_LENGTH,
  sectionCopyFields,
  sectionFrameFields,
} from '../marketing.schema'

export const MAX_MARQUEE_ROWS = 3
export const MAX_MARQUEE_ITEMS = 12

/** The same fields a testimonial card holds, minus the ones a row of them has no room for. */
export const marqueeItemSchema = z.object({
  quote: z
    .string()
    .max(TESTIMONIAL_QUOTE_MAX_LENGTH)
    .default('Short enough to read while it moves.'),
  author: z.string().max(TESTIMONIAL_ATTRIBUTION_MAX_LENGTH).default('Priya Raman'),
  role: z.string().max(TESTIMONIAL_ATTRIBUTION_MAX_LENGTH).default('Staff engineer'),
  company: z.string().max(TESTIMONIAL_ATTRIBUTION_MAX_LENGTH).default('Northwind'),
  avatar: z.string().max(HREF_MAX_LENGTH).default(''),
})

export type MarqueeItem = z.infer<typeof marqueeItemSchema>

const item = (quote: string, author: string, role: string, company: string): MarqueeItem => ({
  quote,
  author,
  role,
  company,
  avatar: '',
})

const DEFAULT_ITEMS: readonly MarqueeItem[] = [
  item(
    'The export is the component I would have written by hand.',
    'Priya Raman',
    'Staff engineer',
    'Northwind',
  ),
  item(
    'Our designers ship the motion now. That used to be a ticket.',
    'Tomas Lind',
    'Design lead',
    'Kestrel',
  ),
  item(
    'Reduced motion works everywhere, which I checked, because it never does.',
    'Amara Osei',
    'Accessibility engineer',
    'Vellum',
  ),
  item(
    'Six breakpoints and I can see which value came from where.',
    'Jonas Weber',
    'Front-end lead',
    'Halden',
  ),
  item('It is a tool, not a demo. That is rare.', 'Mei Chen', 'Product designer', 'Lantern'),
  item(
    'The pricing table alone saved us a week of fighting a CMS.',
    'Rosa Delgado',
    'Marketing engineer',
    'Corvid',
  ),
]

export const testimonialMarqueeSchema = z.object({
  ...sectionCopyFields({
    eyebrow: 'Social proof',
    heading: 'What people do with it',
    description: '',
  }),
  rows: z.number().int().min(1).max(MAX_MARQUEE_ROWS).default(2),
  /** How long one full cycle takes. Slower reads as confident; faster reads as a stock ticker. */
  duration: z.number().int().min(MARQUEE_MIN_DURATION).max(MARQUEE_MAX_DURATION).default(32000),
  pauseOnHover: z.boolean().default(true),
  /** The edge fade. Off for a row on a coloured band, where masking to transparent shows the page. */
  fadeEdges: z.boolean().default(true),
  items: z
    .array(marqueeItemSchema)
    .min(1)
    .max(MAX_MARQUEE_ITEMS)
    .default([...DEFAULT_ITEMS]),
  ...sectionFrameFields(),
})

export type TestimonialMarqueeProps = z.infer<typeof testimonialMarqueeSchema>

/**
 * Which items each row carries, dealt round-robin rather than sliced.
 *
 * Slicing would put the first half of the list in the top row and the second half in the bottom, so a
 * user reordering one item would rearrange both rows. Dealing keeps every row populated even when there
 * are fewer items than rows, and an empty row in a marquee is a band of nothing scrolling past.
 */
export function dealRows<T>(items: readonly T[], rows: number): readonly (readonly T[])[] {
  const count = Math.max(1, Math.min(rows, items.length))

  return Array.from({ length: count }, (_, row) =>
    items.filter((_item, index) => index % count === row),
  )
}

/** Rows alternate, starting leftward — the direction a reader's eye already travels. */
export function rowDirection(row: number): 'left' | 'right' {
  return row % 2 === 0 ? 'left' : 'right'
}

/**
 * Each row runs a little slower than the one above it. Identical durations make two rows read as one
 * block sliding in two pieces; a small offset is what makes them read as independent.
 */
export function rowDuration(base: number, row: number): number {
  return Math.round(base * (1 + row * 0.15))
}
