import { z } from 'zod'

import {
  DESCRIPTION_MAX_LENGTH,
  EYEBROW_MAX_LENGTH,
  HEADING_MAX_LENGTH,
  MAX_ACTIONS,
  actionSchema,
  headingLevel,
  sectionFrameFields,
} from '../marketing.schema'
// Not the barrel: it exports the block's components, and `registry.node.test.ts` asserts that no
// definition pulls React into the metadata half of the registry (ADR-107).
import { newsletterFieldFields } from '../newsletter-form/newsletter-form.schema'

/** What sits opposite the copy. Prompt 38's two answers, and there is no third. */
export const CTA_SIDES = ['form', 'buttons'] as const

export type CtaSide = (typeof CTA_SIDES)[number]

export const CTA_SPLIT_SURFACES = ['surface', 'glass', 'plain'] as const

export type CtaSplitSurface = (typeof CTA_SPLIT_SURFACES)[number]

export const ctaSplitSchema = z.object({
  eyebrow: z.string().max(EYEBROW_MAX_LENGTH).default('Get started'),
  heading: z.string().max(HEADING_MAX_LENGTH).default('Start with the free plan'),
  description: z
    .string()
    .max(DESCRIPTION_MAX_LENGTH)
    .default('Three documents, the whole registry, and every export target. No card.'),
  headingLevel,
  side: z.enum(CTA_SIDES).default('form'),
  surface: z.enum(CTA_SPLIT_SURFACES).default('surface'),
  actions: z
    .array(actionSchema)
    .max(MAX_ACTIONS)
    .default([
      { label: 'Start building', href: '#', variant: 'primary' },
      { label: 'Read the docs', href: '#', variant: 'secondary' },
    ]),
  /** The embedded form's own fields — one definition, shared with `newsletter-form`. */
  ...newsletterFieldFields(),
  ...sectionFrameFields(),
})

export type CtaSplitProps = z.infer<typeof ctaSplitSchema>
