import { z } from 'zod'

import { alignment } from '../../scales'

export const HEADING_SIZES = ['sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const
export const HEADING_WEIGHTS = ['regular', 'medium', 'semibold', 'bold'] as const
export const TRACKING = ['tight', 'normal', 'wide'] as const

export type HeadingSize = (typeof HEADING_SIZES)[number]
export type HeadingWeight = (typeof HEADING_WEIGHTS)[number]
export type HeadingTracking = (typeof TRACKING)[number]

export const HEADING_MAX_LENGTH = 200
export const ANCHOR_MAX_LENGTH = 80

/**
 * A fragment identifier, so a section can be linked to. Empty means the heading has no anchor — the
 * block does not invent one from the text, because a generated id changes the moment somebody edits a
 * word and every link to it breaks silently.
 */
export const ANCHOR_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

/**
 * `level` is the semantic tag and `size` is the type scale, deliberately separate: an `h2` that
 * needs to read as the largest thing on the page is a layout decision, and collapsing the two would
 * make the document outline a styling side effect.
 */
export const headingSchema = z.object({
  text: z.string().max(HEADING_MAX_LENGTH).default('Heading'),
  level: z.number().int().min(1).max(6).default(2),
  size: z.enum(HEADING_SIZES).default('xl'),
  weight: z.enum(HEADING_WEIGHTS).default('semibold'),
  align: alignment.default('start'),
  balance: z.boolean().default(true),
  gradient: z.boolean().default(false),
  tracking: z.enum(TRACKING).default('tight'),
  anchor: z
    .string()
    .max(ANCHOR_MAX_LENGTH)
    .refine((value) => value === '' || ANCHOR_PATTERN.test(value), {
      message: 'An anchor is lowercase letters, digits and hyphens',
    })
    .default(''),
})

export type HeadingProps = z.infer<typeof headingSchema>
