import type { UseFormRegisterReturn } from 'react-hook-form'

import type { FieldIds } from './field-ids'
import type { InputType } from './forms.schema'
import { fieldControlStyles, fieldTextareaStyles } from './forms.styles'

export interface InputControlProps {
  readonly ids: FieldIds
  readonly type: InputType
  readonly name: string
  readonly placeholder: string
  readonly autoComplete: string
  readonly required: boolean
  readonly disabled: boolean
  readonly invalid: boolean
  readonly multiline: boolean
  readonly rows: number
  /**
   * React Hook Form's `register` output, for the two blocks that own a submit. Absent leaves the control
   * uncontrolled, which is what a field block placed on its own is.
   */
  readonly registration?: UseFormRegisterReturn | undefined
}

/**
 * The control, wired.
 *
 * Four attributes carry the wiring and each is here for a reason a test asserts:
 *
 *   - `id` matches the label's `htmlFor`, so clicking the label focuses the field;
 *   - `aria-describedby` lists the hint then the error, and only ids that exist;
 *   - `aria-invalid` is **absent** while the field is valid rather than `false` — a state that is announced only
 *     when it is true is a state the reader hears about only when it matters;
 *   - `aria-required` marks the requirement once, the visible label text carrying the other half.
 *
 * There is no `required` attribute and no `type`-driven native validation, deliberately: the browser's own
 * bubble says the same thing in a place the block can neither style nor announce, which is the call
 * `newsletter-form` made with `noValidate`.
 */
export function InputControl({
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
  registration,
}: InputControlProps) {
  const shared = {
    ...registration,
    'aria-describedby': ids.describedBy,
    'aria-invalid': invalid ? true : undefined,
    'aria-required': required ? true : undefined,
    disabled,
    id: ids.fieldId,
    name,
    placeholder,
    ...(autoComplete === '' ? {} : { autoComplete }),
  }

  if (multiline) {
    return (
      <textarea
        {...shared}
        className={fieldTextareaStyles({ invalid })}
        data-testid="field-control"
        rows={rows}
      />
    )
  }

  return (
    <input
      {...shared}
      className={fieldControlStyles({ invalid })}
      data-testid="field-control"
      type={type}
    />
  )
}
