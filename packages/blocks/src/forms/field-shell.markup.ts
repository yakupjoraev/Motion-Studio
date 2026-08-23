import {
  type MarkupChild,
  type MarkupElement,
  children,
  el,
  literal,
  txt,
} from '@motion-studio/schema'

import type { FieldIds } from './field-ids'
import { REQUIRED_SUFFIX } from './forms.schema'
import {
  FIELD_ERROR,
  FIELD_HINT,
  FIELD_LABEL,
  FIELD_REQUIRED,
  FORM_FIELD,
  fieldControlStyles,
  fieldTextareaStyles,
} from './forms.styles'

/**
 * Label, control, hint, error — the structure prompt 41 specifies, as markup.
 *
 * The order is not cosmetic: `aria-describedby` lists the hint before the error, and a reader moving
 * through the document meets the elements in the order they are announced in.
 */
export interface FieldShellMarkupInput {
  readonly ids: FieldIds
  readonly label: string
  readonly hint: string
  readonly error: string
  readonly required: boolean
  readonly labelVisible?: boolean
  readonly control: MarkupChild
}

/** The visible half of the required marking. The control carries the other half as a state. */
export const requiredMarkMarkup = (): MarkupElement =>
  el('span', {
    classNames: [FIELD_REQUIRED],
    attributes: { 'aria-hidden': literal('true') },
    children: [txt(REQUIRED_SUFFIX)],
  })

/** Always rendered, empty or not: a `role="alert"` that arrives with its text is not announced. */
export const fieldErrorMarkup = (id: string, error: string): MarkupElement =>
  el('p', {
    classNames: [FIELD_ERROR],
    attributes: { id: literal(id), role: literal('alert') },
    children: error === '' ? [] : [txt(error)],
  })

export const fieldHintMarkup = (id: string, hint: string): MarkupElement | null =>
  hint === ''
    ? null
    : el('p', { classNames: [FIELD_HINT], attributes: { id: literal(id) }, children: [txt(hint)] })

export function fieldShellMarkup({
  ids,
  label,
  hint,
  error,
  required,
  labelVisible = true,
  control,
}: FieldShellMarkupInput): MarkupElement {
  return el('div', {
    classNames: [FORM_FIELD],
    attributes: { 'data-invalid': literal(error !== '') },
    children: children(
      el('label', {
        classNames: [labelVisible ? FIELD_LABEL : 'sr-only'],
        attributes: { htmlFor: literal(ids.fieldId), id: literal(ids.labelId) },
        children: children(txt(label), required && requiredMarkMarkup()),
      }),
      control,
      fieldHintMarkup(ids.hintId, hint),
      fieldErrorMarkup(ids.errorId, error),
    ),
  })
}

export interface InputControlMarkupInput {
  readonly ids: FieldIds
  readonly type: string
  readonly name: string
  readonly placeholder: string
  readonly autoComplete: string
  readonly required: boolean
  readonly disabled: boolean
  readonly invalid: boolean
  readonly multiline: boolean
  readonly rows: number
}

/**
 * The control, wired. `aria-invalid` is absent while the field is valid rather than `false`, and there
 * is no `required` attribute: the browser's own bubble says the same thing where the block can neither
 * style nor announce it.
 */
export function inputControlMarkup({
  ids,
  type,
  name,
  placeholder,
  autoComplete,
  required,
  disabled,
  invalid,
  multiline,
  rows,
}: InputControlMarkupInput): MarkupElement {
  const shared = {
    'aria-describedby': literal(ids.describedBy),
    ...(invalid ? { 'aria-invalid': literal(true) } : {}),
    ...(required ? { 'aria-required': literal(true) } : {}),
    ...(disabled ? { disabled: literal(true) } : {}),
    id: literal(ids.fieldId),
    name: literal(name),
    placeholder: literal(placeholder),
    ...(autoComplete === '' ? {} : { autoComplete: literal(autoComplete) }),
  }

  return multiline
    ? el('textarea', {
        classNames: [fieldTextareaStyles({ invalid })],
        attributes: { ...shared, rows: literal(rows) },
      })
    : el('input', {
        classNames: [fieldControlStyles({ invalid })],
        attributes: { ...shared, type: literal(type) },
      })
}
