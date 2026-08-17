import { z } from 'zod'

import { visibility } from '../../scales'
import {
  ALT_MAX_LENGTH,
  HREF_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  TESTIMONIAL_ATTRIBUTION_MAX_LENGTH,
  TESTIMONIAL_QUOTE_MAX_LENGTH,
  cardTreatment,
} from '../marketing.schema'

export const testimonialCardSchema = z.object({
  quote: z
    .string()
    .max(TESTIMONIAL_QUOTE_MAX_LENGTH)
    .default(
      'It exports the component I would have written by hand, which is the only test that matters.',
    ),
  author: z.string().max(TESTIMONIAL_ATTRIBUTION_MAX_LENGTH).default('Priya Raman'),
  role: z.string().max(TESTIMONIAL_ATTRIBUTION_MAX_LENGTH).default('Staff engineer'),
  company: z.string().max(TESTIMONIAL_ATTRIBUTION_MAX_LENGTH).default('Northwind'),
  /** A URL or a data URL. Empty draws the author's initial rather than a broken circle. */
  avatar: z.string().max(HREF_MAX_LENGTH).default(''),
  /** The company's mark, shown above the quote when there is one. */
  logo: z.string().max(HREF_MAX_LENGTH).default(''),
  logoAlt: z.string().max(ALT_MAX_LENGTH).default(''),
  treatment: cardTreatment.default('card'),
  /** A short label above the quote — "Case study", "Since 2024". Empty drops the line. */
  eyebrow: z.string().max(LABEL_MAX_LENGTH).default(''),
  hidden: visibility,
})

export type TestimonialCardProps = z.infer<typeof testimonialCardSchema>

/**
 * How the attribution reads. Role and company are separate props because a page often shows one without
 * the other, and joining them here rather than in the markup keeps the separator out of three components.
 */
export function attributionLine(role: string, company: string): string {
  return [role, company].filter((part) => part !== '').join(', ')
}
