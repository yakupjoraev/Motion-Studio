import { defineMarkup, el } from '@motion-studio/schema'

import { fieldIds } from '../field-ids'
import { fieldShellMarkup, inputControlMarkup } from '../field-shell.markup'
import { formBlockStyles } from '../forms.styles'

import type { InputFieldProps } from './input-field.types'

export const inputFieldMarkup = defineMarkup<InputFieldProps>(
  ({
    props: {
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
    },
    id,
  }) => {
    const ids = fieldIds(id, hint !== '')

    return el('div', {
      classNames: [formBlockStyles({ hidden })],
      children: [
        fieldShellMarkup({
          error,
          hint,
          ids,
          label,
          required,
          control: inputControlMarkup({
            autoComplete,
            disabled,
            ids,
            invalid: error !== '',
            multiline,
            name,
            placeholder,
            required,
            rows,
            type,
          }),
        }),
      ],
    })
  },
)
