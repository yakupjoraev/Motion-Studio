import { children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { iconMarkup } from '../../markup/icon'
import { fieldIds } from '../field-ids'
import { fieldShellMarkup } from '../field-shell.markup'
import { formBlockStyles } from '../forms.styles'

import { startingValue } from './select-field.schema'
import { SELECT_CHEVRON, selectTriggerStyles } from './select-field.styles'
import type { SelectFieldProps } from './select-field.types'

/**
 * The trigger, closed, showing the option the document stored. The listbox lives in a portal that
 * exists only while the select is open, so a closed select *is* this button — on the canvas and in the
 * exported page alike.
 */
export const selectFieldMarkup = defineMarkup<SelectFieldProps>(
  ({
    props: { label, hint, error, required, disabled, options, placeholder, defaultValue, hidden },
    id,
  }) => {
    const ids = fieldIds(id, hint !== '')
    const invalid = error !== ''
    const initial = startingValue(defaultValue, options)
    const chosen = options.find((option) => option.value === initial)

    return el('div', {
      classNames: [formBlockStyles({ hidden })],
      children: [
        fieldShellMarkup({
          error,
          hint,
          ids,
          label,
          required,
          control: el('button', {
            classNames: [selectTriggerStyles({ invalid })],
            attributes: {
              type: literal('button'),
              role: literal('combobox'),
              'aria-expanded': literal(false),
              ...(required ? { 'aria-required': literal(true) } : {}),
              'aria-autocomplete': literal('none'),
              dir: literal('ltr'),
              'data-state': literal('closed'),
              ...(disabled ? { disabled: literal(true) } : {}),
              'aria-describedby': literal(ids.describedBy),
              ...(invalid ? { 'aria-invalid': literal(true) } : {}),
              'aria-labelledby': literal(`${ids.labelId} ${ids.valueId}`),
              id: literal(ids.fieldId),
            },
            children: children(
              el('span', {
                classNames: ['truncate'],
                attributes: { id: literal(ids.valueId) },
                children: [
                  el('span', {
                    children: [txt(chosen === undefined ? placeholder : chosen.label)],
                  }),
                ],
              }),
              iconMarkup({ name: 'chevron-down', size: 16, className: SELECT_CHEVRON }),
            ),
          }),
        }),
      ],
    })
  },
)
