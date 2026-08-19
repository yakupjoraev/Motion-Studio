import type { TypedControl } from '../define-block.types'

import {
  ERROR_MAX_LENGTH,
  FIELD_LABEL_MAX_LENGTH,
  type FieldShape,
  type FormsFrameShape,
  HINT_MAX_LENGTH,
  NAME_MAX_LENGTH,
} from './forms.schema'

/**
 * The controls every block in the category shares, typed against the *shape* rather than the block — the
 * device `SECTION_COPY_CONTROLS` and `INTERACTIVE_FRAME_CONTROLS` both use, and it is the compiler enforcing
 * ADR-110.
 */
export const FORMS_FRAME_CONTROLS: readonly TypedControl<FormsFrameShape>[] = [
  { path: 'hidden', kind: 'switch', label: 'Hidden', responsive: true },
]

export const FIELD_CONTROLS: readonly TypedControl<FieldShape>[] = [
  {
    path: 'label',
    kind: 'text',
    label: 'Label',
    hint: 'Always visible. A placeholder is not a label',
    options: { maxLength: FIELD_LABEL_MAX_LENGTH },
  },
  {
    path: 'hint',
    kind: 'text',
    label: 'Hint',
    hint: 'Announced before the error, as part of the field’s description',
    options: { maxLength: HINT_MAX_LENGTH },
  },
  {
    path: 'error',
    kind: 'text',
    label: 'Error',
    hint: 'Say what to do — “Enter a valid email address”, not “Invalid input”. Empty means valid',
    options: { maxLength: ERROR_MAX_LENGTH },
  },
  {
    path: 'required',
    kind: 'switch',
    label: 'Required',
    hint: 'Marks the label and sets aria-required',
  },
  { path: 'disabled', kind: 'switch', label: 'Disabled' },
  {
    path: 'name',
    kind: 'text',
    label: 'Field name',
    hint: 'What the value is submitted under, and what a browser’s autofill matches on',
    options: { maxLength: NAME_MAX_LENGTH },
  },
]
