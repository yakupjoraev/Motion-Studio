import { z } from 'zod'

import {
  DESCRIPTION_MAX_LENGTH,
  EYEBROW_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  mediaSchema,
  sectionCopyFields,
  sectionFrameFields,
} from '../marketing.schema'

export const MAX_SPLIT_ROWS = 6

const EMPTY_MEDIA = {
  src: '',
  alt: '',
  width: 1600,
  height: 1000,
  sizes: '(min-width: 1024px) 50vw, 100vw',
} as const

export const featureRowSchema = z.object({
  eyebrow: z.string().max(EYEBROW_MAX_LENGTH).default(''),
  title: z.string().max(TITLE_MAX_LENGTH).default('A feature worth a row of its own'),
  body: z.string().max(DESCRIPTION_MAX_LENGTH).default('Two or three sentences on what it does.'),
  media: mediaSchema,
  /** Flips this row against whatever the section's alternation would have given it. */
  reversed: z.boolean().default(false),
})

export type FeatureRow = z.infer<typeof featureRowSchema>

const DEFAULT_ROWS: readonly FeatureRow[] = [
  {
    eyebrow: 'Canvas',
    title: 'Edit the real component, not a mock of it',
    body: 'Drop a block and you are looking at the component that ships. Props are typed, motion is live, and the export is the same tree you just arranged.',
    media: EMPTY_MEDIA,
    reversed: false,
  },
  {
    eyebrow: 'Motion',
    title: 'Timing you can feel before you ship it',
    body: 'Fifty-one presets across six channels, a spring the inspector draws by integrating it, and one reduced-motion policy every one of them honours.',
    media: EMPTY_MEDIA,
    reversed: false,
  },
]

export const featureSplitSchema = z.object({
  ...sectionCopyFields({
    eyebrow: '',
    heading: 'Two halves, one decision at a time',
    description: '',
  }),
  /** Alternate sides down the section, which is what makes a stack of rows read as a rhythm. */
  alternate: z.boolean().default(true),
  rows: z
    .array(featureRowSchema)
    .min(1)
    .max(MAX_SPLIT_ROWS)
    .default([...DEFAULT_ROWS]),
  ...sectionFrameFields(),
})

export type FeatureSplitProps = z.infer<typeof featureSplitSchema>

/**
 * Which side the media sits on. `alternate` is the section's rhythm and `reversed` is the row's own
 * exception to it, so the two compose with an exclusive-or rather than one overriding the other — a
 * user who flips one row inside an alternating section wants *that* row flipped, not the rhythm broken
 * from there down.
 */
export function rowIsReversed(index: number, alternate: boolean, reversed: boolean): boolean {
  const byRhythm = alternate && index % 2 === 1

  return byRhythm !== reversed
}
