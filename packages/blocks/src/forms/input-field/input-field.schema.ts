import { z } from 'zod'

import {
  INPUT_TYPES,
  NAME_MAX_LENGTH,
  PLACEHOLDER_MAX_LENGTH,
  fieldFields,
  formsFrameFields,
} from '../forms.schema'

export const MULTILINE_ROWS_MIN = 2
export const MULTILINE_ROWS_MAX = 12

export const inputFieldSchema = z.object({
  ...fieldFields({
    label: 'Email address',
    hint: 'We’ll only use it to reply to you.',
    name: 'email',
  }),
  type: z.enum(INPUT_TYPES).default('email'),
  /** Beside the label, never instead of it: a placeholder disappears the moment the reader starts typing. */
  placeholder: z.string().max(PLACEHOLDER_MAX_LENGTH).default('you@company.com'),
  /**
   * The browser's own autofill token — `email`, `name`, `tel`, `street-address`. Empty turns it off. A field
   * with no token is a field a returning visitor types out again.
   */
  autoComplete: z.string().max(NAME_MAX_LENGTH).default('email'),
  multiline: z.boolean().default(false),
  rows: z.number().int().min(MULTILINE_ROWS_MIN).max(MULTILINE_ROWS_MAX).default(4),
  ...formsFrameFields(),
})

export type InputFieldProps = z.infer<typeof inputFieldSchema>
