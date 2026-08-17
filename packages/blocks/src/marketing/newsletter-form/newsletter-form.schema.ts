import { z } from 'zod'

import { visibility } from '../../scales'
import {
  BODY_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  HEADING_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  headingLevel,
} from '../marketing.schema'

export const NEWSLETTER_STATES = ['idle', 'loading', 'success', 'error'] as const

export type NewsletterState = (typeof NEWSLETTER_STATES)[number]

/**
 * The field, the button and the four messages — everything the form is minus the words above it.
 *
 * A factory rather than a constant because `cta-split` embeds the same form beside its own copy, and it
 * needs these fields without the heading and description this block owns. One definition, two callers.
 */
export const newsletterFieldFields = () => ({
  /** The field's own label. Visible by default: a placeholder is not a label. */
  label: z.string().max(LABEL_MAX_LENGTH).default('Email address'),
  showLabel: z.boolean().default(true),
  placeholder: z.string().max(LABEL_MAX_LENGTH).default('you@company.com'),
  submitLabel: z.string().max(LABEL_MAX_LENGTH).default('Subscribe'),
  /** What the four states say. Words are the user's, not the block's. */
  invalidMessage: z
    .string()
    .max(BODY_MAX_LENGTH)
    .default('Enter an email address like you@company.com.'),
  successMessage: z.string().max(BODY_MAX_LENGTH).default('Check your inbox to confirm.'),
  errorMessage: z
    .string()
    .max(BODY_MAX_LENGTH)
    .default('That did not go through. Try again in a moment.'),
  /** Small print under the field — a consent line, a link to a policy. Empty drops it. */
  note: z.string().max(BODY_MAX_LENGTH).default('One email a month. Unsubscribe in one click.'),
})

/** What a shared `TypedControl` for the field is checked against. */
export interface NewsletterFieldShape {
  readonly label: string
  readonly showLabel: boolean
  readonly placeholder: string
  readonly submitLabel: string
  readonly invalidMessage: string
  readonly successMessage: string
  readonly errorMessage: string
  readonly note: string
}

export const newsletterFormSchema = z.object({
  heading: z.string().max(HEADING_MAX_LENGTH).default('Ship notes, once a month'),
  description: z
    .string()
    .max(DESCRIPTION_MAX_LENGTH)
    .default('What changed, what broke, and what we learned. No drip campaign.'),
  headingLevel,
  ...newsletterFieldFields(),
  hidden: visibility,
})

export type NewsletterFormShape = z.infer<typeof newsletterFormSchema>

/**
 * Whether the address is worth submitting.
 *
 * Deliberately not a strict RFC 5322 check: every regex that tries rejects addresses that are valid, and
 * the only authority on whether an address works is the server that mails it. This catches the typo the
 * reader can see — no `@`, nothing before or after it, no dot in the domain — and the field is
 * `type="email"` as well, so the browser's own check runs first.
 */
export function emailLooksValid(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}
