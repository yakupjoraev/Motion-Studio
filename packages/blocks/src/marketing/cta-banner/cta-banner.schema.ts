import { z } from 'zod'

import { alignment } from '../../scales'
import {
  DESCRIPTION_MAX_LENGTH,
  EYEBROW_MAX_LENGTH,
  HEADING_MAX_LENGTH,
  MAX_ACTIONS,
  actionSchema,
  headingLevel,
  sectionFrameFields,
} from '../marketing.schema'

/**
 * How the band is painted. Four values, and they are not degrees of one thing:
 *
 *   - `gradient` is the accent ramp with a specular highlight (`ms-cta-gradient` in `blocks.css`);
 *   - `accent` is the flat accent, for a page that already has a gradient somewhere;
 *   - `glass` needs something behind it and follows the theme's own recipe;
 *   - `surface` is the quiet one — a hairline and one surface step, for a band between two loud sections.
 */
export const CTA_SURFACES = ['gradient', 'accent', 'glass', 'surface'] as const

export type CtaSurface = (typeof CTA_SURFACES)[number]

export const ctaBannerSchema = z.object({
  eyebrow: z.string().max(EYEBROW_MAX_LENGTH).default(''),
  heading: z.string().max(HEADING_MAX_LENGTH).default('Build the page, keep the code'),
  description: z
    .string()
    .max(DESCRIPTION_MAX_LENGTH)
    .default('Every block exports as the component you would have written by hand.'),
  headingLevel,
  align: alignment.default('center'),
  surface: z.enum(CTA_SURFACES).default('gradient'),
  actions: z
    .array(actionSchema)
    .max(MAX_ACTIONS)
    .default([
      { label: 'Start building', href: '#', variant: 'primary' },
      { label: 'Read the docs', href: '#', variant: 'secondary' },
    ]),
  ...sectionFrameFields(),
})

export type CtaBannerProps = z.infer<typeof ctaBannerSchema>

/**
 * Whether the band's own background is the accent colour, which decides whether the buttons invert.
 * A primary button painted `accent` on an `accent` band is a button nobody can see.
 */
export function bandIsAccent(surface: CtaSurface): boolean {
  return surface === 'gradient' || surface === 'accent'
}
