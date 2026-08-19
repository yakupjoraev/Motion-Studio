import { z } from 'zod'

import { visibility } from '../scales'

export const FIELD_LABEL_MAX_LENGTH = 64
export const HINT_MAX_LENGTH = 160
export const ERROR_MAX_LENGTH = 160
export const PLACEHOLDER_MAX_LENGTH = 64
export const NAME_MAX_LENGTH = 32
export const OPTION_MAX_LENGTH = 64
export const MESSAGE_MAX_LENGTH = 240

/**
 * What a required field says in its own label.
 *
 * The word, not only an asterisk: an asterisk is a convention a reader has to already know, and prompt 41's
 * requirement is that the label text carries the requirement. It is `aria-hidden` at the call site, because
 * `aria-required` on the control announces the same fact and a label carrying it too would say it twice —
 * once in the accessible name and once as the state.
 */
export const REQUIRED_SUFFIX = '(required)'

/**
 * The fields every field block shares.
 *
 * `error` is a **string the author sets**, not something the block derives: a field placed on a canvas has an
 * error state its designer needs to see and style, and a field that validated itself would show none at its
 * defaults. Validation belongs to the two blocks that own a submit — `contact-form` and `waitlist-form`.
 */
export const fieldFields = (defaults: {
  readonly label: string
  readonly hint: string
  readonly name: string
}) => ({
  label: z.string().min(1).max(FIELD_LABEL_MAX_LENGTH).default(defaults.label),
  /** Never a placeholder standing in for a label — the label element is not optional. */
  hint: z.string().max(HINT_MAX_LENGTH).default(defaults.hint),
  /**
   * Empty means valid. Non-empty is what drives `aria-invalid`, so the attribute is present only when the
   * field is actually invalid.
   */
  error: z.string().max(ERROR_MAX_LENGTH).default(''),
  required: z.boolean().default(false),
  disabled: z.boolean().default(false),
  /** The name the value is submitted under. Also what a browser's autofill matches on. */
  name: z.string().min(1).max(NAME_MAX_LENGTH).default(defaults.name),
})

export interface FieldShape {
  readonly label: string
  readonly hint: string
  readonly error: string
  readonly required: boolean
  readonly disabled: boolean
  readonly name: string
}

/** Every block in the category answers the responsive visibility prop — ADR-117. */
export const formsFrameFields = () => ({ hidden: visibility })

export type FormsFrameShape = { readonly hidden: boolean }

/**
 * The types a text field can honestly be. Each one changes the on-screen keyboard a phone offers and the checks a
 * browser would run, which is why it is an enum rather than a free string: `type="emial"` is a text field with no
 * complaint from anyone.
 *
 * Declared for the category rather than for `input-field`, because three blocks render the same control.
 *
 * `checkbox` and `radio` are not here — that is `checkbox-field`, which is a group with a legend.
 */
export const INPUT_TYPES = ['text', 'email', 'tel', 'url', 'password', 'number', 'search'] as const

export type InputType = (typeof INPUT_TYPES)[number]

/**
 * The four states a submitting form can be in. The same vocabulary `newsletter-form` uses, under the same
 * names, because a reader who has learned one form's states should not have to learn a second set.
 */
export const FORM_STATES = ['idle', 'submitting', 'success', 'error'] as const

export type FormState = (typeof FORM_STATES)[number]
