import { type ReactElement, memo } from 'react'

import { Select } from '../../select/index'
import { controlLabelProps } from '../control-row/index'

import type { SelectFieldProps } from './select-field.types'

/**
 * A choice has no intermediate state, so `onChange` and `onCommit` fire together — the pair is kept so
 * every control reads the same way at the call site.
 *
 * The empty string is what Radix treats as "no selection", which is how § Multi-selection's `Mixed`
 * placeholder gets shown without the control leaving controlled mode.
 */
function SelectFieldImpl({
  value,
  onChange,
  onCommit,
  label,
  labelledBy,
  describedBy,
  id,
  disabled = false,
  mixed = false,
  options,
  placeholder = 'Select…',
  invalid = false,
  className,
}: SelectFieldProps): ReactElement {
  return (
    <Select
      id={id}
      value={mixed ? '' : value}
      options={options}
      placeholder={mixed ? 'Mixed' : placeholder}
      disabled={disabled}
      invalid={invalid}
      aria-describedby={describedBy}
      className={className}
      onValueChange={(next: string) => {
        onChange(next)
        onCommit(next)
      }}
      {...controlLabelProps(label, labelledBy)}
    />
  )
}

export const SelectField = memo(SelectFieldImpl)
