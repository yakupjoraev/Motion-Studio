import { z } from 'zod'

import {
  ERROR_MAX_LENGTH,
  FIELD_LABEL_MAX_LENGTH,
  HINT_MAX_LENGTH,
  MESSAGE_MAX_LENGTH,
  PLACEHOLDER_MAX_LENGTH,
  formsFrameFields,
} from '../forms.schema'

export const waitlistFormSchema = z.object({
  label: z.string().min(1).max(FIELD_LABEL_MAX_LENGTH).default('Email address'),
  /**
   * Whether the label is drawn. Off puts it in `sr-only` — the element is **always** there, because a placeholder
   * is not a label and a compact form is not an excuse for one.
   */
  showLabel: z.boolean().default(false),
  hint: z.string().max(HINT_MAX_LENGTH).default(''),
  placeholder: z.string().max(PLACEHOLDER_MAX_LENGTH).default('you@company.com'),
  invalidMessage: z.string().min(1).max(ERROR_MAX_LENGTH).default('Enter a valid email address.'),
  submitLabel: z.string().min(1).max(FIELD_LABEL_MAX_LENGTH).default('Join the waitlist'),
  submittingLabel: z.string().min(1).max(FIELD_LABEL_MAX_LENGTH).default('Joining'),
  successTitle: z.string().min(1).max(FIELD_LABEL_MAX_LENGTH).default('You’re on the list'),
  successBody: z
    .string()
    .max(MESSAGE_MAX_LENGTH)
    .default('We’ll write when there’s something to try.'),
  failureMessage: z
    .string()
    .min(1)
    .max(MESSAGE_MAX_LENGTH)
    .default('That did not go through. Try again in a moment.'),
  note: z.string().max(MESSAGE_MAX_LENGTH).default('One email when we launch. Nothing else.'),
  ...formsFrameFields(),
})

export type WaitlistFormShape = z.infer<typeof waitlistFormSchema>

export interface WaitlistValues {
  readonly email: string
  readonly reference: string
}

/**
 * What the resolver validates, built from the author's own message.
 *
 * Zod's own email check, which is the single source of truth `TECH_STACK.md` names — not a second hand-written
 * regex beside `newsletter-form`'s. The honeypot is not validated here, for the reason `contact-form` gives.
 */
export const waitlistValuesSchema = (invalidMessage: string) =>
  z.object({
    email: z.string().trim().email(invalidMessage),
    reference: z.string(),
  })
