'use client'

import { useId } from 'react'

import { fieldIds } from '../field-ids'
import { FieldShell } from '../field-shell'
import { formBlockStyles } from '../forms.styles'
import { InputControl } from '../input-control'

import type { InputFieldProps } from './input-field.types'

/**
 * A text field, fully wired: label, control, hint, error.
 *
 * The ids come from `useId`, so two of these on one page cannot collide — which is the difference between a
 * field block and a snippet: an author will place the same block twice, and a hard-coded id would silently
 * point the second field's label at the first field's input.
 *
 * The block does not validate. `error` is a string its author sets, because a field on a canvas has an error
 * state its designer needs to see and style; validation lives in `contact-form` and `waitlist-form`, which own
 * a submit and therefore own a moment to validate at.
 */
export function InputField({
  label,
  hint,
  error,
  required,
  disabled,
  name,
  type,
  placeholder,
  autoComplete,
  multiline,
  rows,
  hidden,
}: InputFieldProps) {
  const ids = fieldIds(useId(), hint !== '')

  return (
    <div className={formBlockStyles({ hidden })} data-testid="input-field">
      <FieldShell error={error} hint={hint} ids={ids} label={label} required={required}>
        <InputControl
          autoComplete={autoComplete}
          disabled={disabled}
          ids={ids}
          invalid={error !== ''}
          multiline={multiline}
          name={name}
          placeholder={placeholder}
          required={required}
          rows={rows}
          type={type}
        />
      </FieldShell>
    </div>
  )
}
