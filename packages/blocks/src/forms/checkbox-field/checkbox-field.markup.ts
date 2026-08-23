import { children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { fieldIds } from '../field-ids'
import { fieldErrorMarkup, fieldHintMarkup, requiredMarkMarkup } from '../field-shell.markup'
import {
  CHOICE_HINT,
  CHOICE_INPUT,
  CHOICE_LABEL,
  CHOICE_ROW,
  FIELD_GROUP,
  FIELD_LEGEND,
  choiceListStyles,
  formBlockStyles,
} from '../forms.styles'

import { startingChoice } from './checkbox-field.schema'
import type { CheckboxFieldProps } from './checkbox-field.types'

export const checkboxFieldMarkup = defineMarkup<CheckboxFieldProps>(
  ({
    props: { label, hint, error, required, disabled, name, mode, layout, choices, hidden },
    id,
  }) => {
    const ids = fieldIds(id, hint !== '')
    const invalid = error !== ''
    const radioStart = startingChoice(mode, choices)

    return el('div', {
      classNames: [formBlockStyles({ hidden })],
      children: [
        el('fieldset', {
          classNames: [FIELD_GROUP],
          attributes: {
            'aria-describedby': literal(ids.describedBy),
            ...(invalid ? { 'aria-invalid': literal(true) } : {}),
            'data-invalid': literal(invalid),
          },
          children: children(
            el('legend', {
              classNames: [FIELD_LEGEND],
              children: children(txt(label), required && requiredMarkMarkup()),
            }),
            el('div', {
              classNames: [choiceListStyles({ layout })],
              children: choices.map((choice, index) => {
                const choiceId = `${ids.fieldId}-choice-${index}`
                const hintId = `${choiceId}-hint`
                const checked = mode === 'radio' ? choice.value === radioStart : choice.checked

                return el('div', {
                  classNames: [CHOICE_ROW],
                  children: [
                    el('input', {
                      classNames: [CHOICE_INPUT],
                      attributes: {
                        ...(required ? { 'aria-required': literal(true) } : {}),
                        ...(checked ? { defaultChecked: literal(true) } : {}),
                        ...(disabled || choice.disabled ? { disabled: literal(true) } : {}),
                        id: literal(choiceId),
                        name: literal(name),
                        type: literal(mode),
                        value: literal(choice.value),
                        ...(choice.hint === '' ? {} : { 'aria-describedby': literal(hintId) }),
                      },
                    }),
                    el('span', {
                      classNames: ['flex min-w-0 flex-col gap-1'],
                      children: children(
                        el('label', {
                          classNames: [CHOICE_LABEL],
                          attributes: { htmlFor: literal(choiceId) },
                          children: [txt(choice.label)],
                        }),
                        choice.hint !== '' &&
                          el('p', {
                            classNames: [CHOICE_HINT],
                            attributes: { id: literal(hintId) },
                            children: [txt(choice.hint)],
                          }),
                      ),
                    }),
                  ],
                })
              }),
            }),
            fieldHintMarkup(ids.hintId, hint),
            fieldErrorMarkup(ids.errorId, error),
          ),
        }),
      ],
    })
  },
)
