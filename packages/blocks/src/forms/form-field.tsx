import type { UseFormRegisterReturn } from 'react-hook-form'

import type { FieldIds } from './field-ids'
import { FieldShell } from './field-shell'
import type { InputType } from './forms.schema'
import { InputControl } from './input-control'

export interface FormFieldProps {
  readonly ids: FieldIds
  readonly label: string
  readonly hint: string
  /** The message React Hook Form produced for this field, or empty while it is valid. */
  readonly error: string
  readonly required: boolean
  readonly placeholder: string
  readonly autoComplete: string
  readonly type: InputType
  readonly multiline: boolean
  readonly rows: number
  readonly disabled: boolean
  readonly registration: UseFormRegisterReturn
}

/**
 * A field inside a form that validates.
 *
 * The same shell, the same control and the same four attributes as the standalone `input-field` — the only
 * difference is where `error` comes from: there it is a prop the author sets, here it is the resolver's own
 * message. That is what makes the wiring one implementation rather than two that have to be kept in step.
 *
 * `registration` carries React Hook Form's `ref`, which is what lets the library move focus to the first invalid
 * field on a failed submit.
 */
export function FormField({
  ids,
  label,
  hint,
  error,
  required,
  placeholder,
  autoComplete,
  type,
  multiline,
  rows,
  disabled,
  registration,
}: FormFieldProps) {
  return (
    <FieldShell error={error} hint={hint} ids={ids} label={label} required={required}>
      <InputControl
        autoComplete={autoComplete}
        disabled={disabled}
        ids={ids}
        invalid={error !== ''}
        multiline={multiline}
        name={registration.name}
        placeholder={placeholder}
        registration={registration}
        required={required}
        rows={rows}
        type={type}
      />
    </FieldShell>
  )
}
