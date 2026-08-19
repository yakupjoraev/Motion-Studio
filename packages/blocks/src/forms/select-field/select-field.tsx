'use client'

import { ChevronDownIcon } from '@motion-studio/icons'
import * as RadixSelect from '@radix-ui/react-select'
import { useId } from 'react'

import { fieldIds } from '../field-ids'
import { FieldShell } from '../field-shell'
import { formBlockStyles } from '../forms.styles'

import { startingValue } from './select-field.schema'
import { SELECT_CHEVRON, selectTriggerStyles } from './select-field.styles'
import type { SelectFieldProps } from './select-field.types'
import { SelectOptionList } from './select-option-list'

/**
 * A select with the same wiring as the text field: label, control, hint, error.
 *
 * Radix Select rather than a native `<select>`, which prompt 41 specifies. That choice moves the accessible
 * name: the trigger is a `<button>`, and a `<label for>` on a button is legal HTML but is **not** part of the
 * name computation for a button, so the trigger carries `aria-labelledby`. The `htmlFor` is still there and
 * still does its job — clicking the label reaches the control, which opens the list.
 *
 * It names the label **and the element holding the displayed value**, so the name becomes the field's label
 * followed by the current choice and a reader hears both. Naming the label alone would announce "Export target"
 * and leave the chosen value unspoken; a self-reference back to the trigger contributes nothing at all, which is
 * the measurement ADR-215 records.
 */
export function SelectField({
  label,
  hint,
  error,
  required,
  disabled,
  name,
  options,
  placeholder,
  defaultValue,
  hidden,
}: SelectFieldProps) {
  const ids = fieldIds(useId(), hint !== '')
  const invalid = error !== ''
  const initial = startingValue(defaultValue, options)

  return (
    <div className={formBlockStyles({ hidden })} data-testid="select-field">
      <FieldShell error={error} hint={hint} ids={ids} label={label} required={required}>
        <RadixSelect.Root
          disabled={disabled}
          name={name}
          {...(initial === undefined ? {} : { defaultValue: initial })}
        >
          <RadixSelect.Trigger
            aria-describedby={ids.describedBy}
            aria-invalid={invalid ? true : undefined}
            aria-labelledby={`${ids.labelId} ${ids.valueId}`}
            aria-required={required ? true : undefined}
            className={selectTriggerStyles({ invalid })}
            data-testid="field-control"
            id={ids.fieldId}
          >
            <span className="truncate" id={ids.valueId}>
              <RadixSelect.Value placeholder={placeholder} />
            </span>
            <RadixSelect.Icon asChild>
              <ChevronDownIcon aria-hidden="true" className={SELECT_CHEVRON} size={16} />
            </RadixSelect.Icon>
          </RadixSelect.Trigger>

          <SelectOptionList options={options} />
        </RadixSelect.Root>
      </FieldShell>
    </div>
  )
}
