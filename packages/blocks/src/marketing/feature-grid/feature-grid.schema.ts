import { z } from 'zod'

import { narrowLayout } from '../../scales'

import {
  BODY_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  cardTreatment,
  sectionCopyFields,
  sectionFrameFields,
} from '../marketing.schema'

export const FEATURE_MIN_COLUMNS = 2
export const FEATURE_MAX_COLUMNS = 4
export const MAX_FEATURE_CELLS = 9

/** An icon name from `packages/icons`; an empty string draws no plate rather than an empty one. */
export const featureSchema = z.object({
  icon: z.string().max(48).default('zap'),
  title: z.string().max(TITLE_MAX_LENGTH).default('Feature'),
  body: z.string().max(BODY_MAX_LENGTH).default('What it does, in one sentence.'),
})

export type Feature = z.infer<typeof featureSchema>

const DEFAULT_ITEMS: readonly Feature[] = [
  {
    icon: 'zap',
    title: 'Real components',
    body: 'Every block is a production React component, not a picture of one.',
  },
  {
    icon: 'curve',
    title: 'Motion you can tune',
    body: 'Fifty-one presets, six channels, and a curve editor that draws the spring.',
  },
  {
    icon: 'export',
    title: 'Export that compiles',
    body: 'React, Next, or plain HTML — typed, formatted, and yours to keep.',
  },
  {
    icon: 'palette',
    title: 'Themes that carry',
    body: 'One control takes a document from sharp to soft, light to dark.',
  },
  {
    icon: 'radius',
    title: 'Responsive by default',
    body: 'Six breakpoints, overrides that show where they came from.',
  },
  {
    icon: 'success',
    title: 'Accessible on arrival',
    body: 'Keyboard paths, focus rings and reduced motion are not a later phase.',
  },
]

export const featureGridSchema = z.object({
  ...sectionCopyFields({
    eyebrow: 'What you get',
    heading: 'Everything a landing page needs, already built',
    description:
      'Twelve marketing blocks, each one a real component with a schema, controls and an export.',
  }),
  columns: z.number().int().min(FEATURE_MIN_COLUMNS).max(FEATURE_MAX_COLUMNS).default(3),
  narrow: narrowLayout,
  treatment: cardTreatment.default('card'),
  showIcons: z.boolean().default(true),
  items: z
    .array(featureSchema)
    .min(1)
    .max(MAX_FEATURE_CELLS)
    .default([...DEFAULT_ITEMS]),
  ...sectionFrameFields(),
})

export type FeatureGridProps = z.infer<typeof featureGridSchema>
