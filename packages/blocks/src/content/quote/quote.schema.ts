import { z } from 'zod'

import { alignment, visibility } from '../../scales'

export const QUOTE_SIZES = ['md', 'lg', 'xl'] as const

export type QuoteSize = (typeof QUOTE_SIZES)[number]

/** How the quotation is marked: a rule beside it, a large glyph behind it, or nothing but the type. */
export const QUOTE_MARKS = ['rule', 'glyph', 'none'] as const

export type QuoteMark = (typeof QUOTE_MARKS)[number]

export const QUOTE_MAX_LENGTH = 800
export const ATTRIBUTION_MAX_LENGTH = 80

export const quoteSchema = z.object({
  quote: z
    .string()
    .max(QUOTE_MAX_LENGTH)
    .default('It exports the component I would have written, which is the only test that matters.'),
  author: z.string().max(ATTRIBUTION_MAX_LENGTH).default('Priya Raman'),
  role: z.string().max(ATTRIBUTION_MAX_LENGTH).default('Staff engineer, Northwind'),
  /** A URL or a data URL. Empty renders the author's initial rather than a broken circle. */
  avatar: z.string().max(2048).default(''),
  size: z.enum(QUOTE_SIZES).default('lg'),
  mark: z.enum(QUOTE_MARKS).default('rule'),
  align: alignment.default('start'),
  hidden: visibility,
})

export type QuoteProps = z.infer<typeof quoteSchema>
