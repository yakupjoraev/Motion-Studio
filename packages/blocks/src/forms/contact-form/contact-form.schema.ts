import { z } from 'zod'

import { headingLevel } from '../../marketing/marketing.schema'
import {
  ERROR_MAX_LENGTH,
  FIELD_LABEL_MAX_LENGTH,
  HINT_MAX_LENGTH,
  MESSAGE_MAX_LENGTH,
  PLACEHOLDER_MAX_LENGTH,
  formsFrameFields,
} from '../forms.schema'

export const MIN_MESSAGE_LENGTH = 10

/**
 * One field's words.
 *
 * The **error message is the author's**, and its default says what to do rather than what went wrong — "Enter a
 * valid email address", not "Invalid input". A message that names the defect leaves the reader to work out the
 * remedy, which is the specific failure prompt 41 calls out.
 */
export const contactFieldSchema = z.object({
  label: z.string().min(1).max(FIELD_LABEL_MAX_LENGTH),
  hint: z.string().max(HINT_MAX_LENGTH).default(''),
  placeholder: z.string().max(PLACEHOLDER_MAX_LENGTH).default(''),
  error: z.string().min(1).max(ERROR_MAX_LENGTH),
})

export type ContactField = z.infer<typeof contactFieldSchema>

export const contactFormSchema = z.object({
  heading: z.string().max(FIELD_LABEL_MAX_LENGTH).default('Tell us what you’re building'),
  description: z
    .string()
    .max(MESSAGE_MAX_LENGTH)
    .default('We read everything and reply within a working day.'),
  headingLevel: headingLevel.default(2),
  name: contactFieldSchema.default({
    label: 'Your name',
    hint: '',
    placeholder: 'Ada Lovelace',
    error: 'Enter your name.',
  }),
  email: contactFieldSchema.default({
    label: 'Email address',
    hint: 'We’ll reply to this address.',
    placeholder: 'you@company.com',
    error: 'Enter a valid email address.',
  }),
  message: contactFieldSchema.default({
    label: 'What can we help with?',
    hint: 'A sentence or two is plenty.',
    placeholder: 'A landing page for a docs site we launch in March.',
    error: 'Write at least a sentence so we know what to reply to.',
  }),
  submitLabel: z.string().min(1).max(FIELD_LABEL_MAX_LENGTH).default('Send message'),
  submittingLabel: z.string().min(1).max(FIELD_LABEL_MAX_LENGTH).default('Sending'),
  successTitle: z.string().min(1).max(FIELD_LABEL_MAX_LENGTH).default('Message sent'),
  successBody: z
    .string()
    .max(MESSAGE_MAX_LENGTH)
    .default('We’ll reply to the address you gave us within a working day.'),
  /** What the reader is told when the handler itself failed. Not their fault, so not their field's error. */
  failureMessage: z
    .string()
    .min(1)
    .max(MESSAGE_MAX_LENGTH)
    .default('That did not go through. Try again in a moment.'),
  note: z.string().max(MESSAGE_MAX_LENGTH).default(''),
  ...formsFrameFields(),
})

export type ContactFormShape = z.infer<typeof contactFormSchema>

export interface ContactValues {
  readonly name: string
  readonly email: string
  readonly message: string
  readonly reference: string
}

/**
 * What the resolver validates, built from the author's own messages.
 *
 * A factory rather than a constant, because the messages are props: the reader of a generated project edits the
 * words in one place and both the schema and the field pick them up.
 *
 * The email check is Zod's, which is the single source of truth `TECH_STACK.md` names — not a hand-written regex.
 * The honeypot is **not** validated here: a filled trap resolves to success without the handler running, and a
 * resolver error would move focus into an off-screen field.
 */
export const contactValuesSchema = (props: {
  readonly name: ContactField
  readonly email: ContactField
  readonly message: ContactField
}) =>
  z.object({
    name: z.string().trim().min(1, props.name.error),
    email: z.string().trim().email(props.email.error),
    message: z.string().trim().min(MIN_MESSAGE_LENGTH, props.message.error),
    reference: z.string(),
  })
