import type { TypedControl } from '../../define-block.types'
import { BODY_MAX_LENGTH, LABEL_MAX_LENGTH } from '../marketing.schema'

import type { NewsletterFieldShape } from './newsletter-form.schema'

/**
 * The field's controls, typed against the shape — so `cta-split`, which embeds the same field, gets them
 * without restating eight descriptors. The same device `SECTION_COPY_CONTROLS` uses.
 */
export const NEWSLETTER_FIELD_CONTROLS: readonly TypedControl<NewsletterFieldShape>[] = [
  { path: 'label', kind: 'text', label: 'Label', options: { maxLength: LABEL_MAX_LENGTH } },
  {
    path: 'showLabel',
    kind: 'switch',
    label: 'Show the label',
    hint: 'Hidden it stays in the accessibility tree — a placeholder is not a label',
  },
  {
    path: 'placeholder',
    kind: 'text',
    label: 'Placeholder',
    options: { maxLength: LABEL_MAX_LENGTH },
  },
  {
    path: 'submitLabel',
    kind: 'text',
    label: 'Button',
    options: { maxLength: LABEL_MAX_LENGTH },
  },
  {
    path: 'note',
    kind: 'text',
    label: 'Small print',
    hint: 'A consent line under the field. Empty drops it',
    options: { maxLength: BODY_MAX_LENGTH },
  },
]

export const NEWSLETTER_MESSAGE_CONTROLS: readonly TypedControl<NewsletterFieldShape>[] = [
  {
    path: 'invalidMessage',
    kind: 'text',
    label: 'Not an address',
    options: { maxLength: BODY_MAX_LENGTH },
  },
  {
    path: 'successMessage',
    kind: 'text',
    label: 'Succeeded',
    options: { maxLength: BODY_MAX_LENGTH },
  },
  {
    path: 'errorMessage',
    kind: 'text',
    label: 'Failed',
    options: { maxLength: BODY_MAX_LENGTH },
  },
]
