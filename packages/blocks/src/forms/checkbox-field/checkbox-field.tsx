'use client'

import { useId } from 'react'

import { fieldIds } from '../field-ids'
import { FieldError, FieldHint } from '../field-messages'
import { FIELD_GROUP, FIELD_LEGEND, choiceListStyles, formBlockStyles } from '../forms.styles'
import { RequiredMark } from '../required-mark'

import { startingChoice } from './checkbox-field.schema'
import type { CheckboxFieldProps } from './checkbox-field.types'
import { ChoiceRow } from './choice-row'

/**
 * A group of choices, with a legend.
 *
 * The one field in the category whose frame is a `<fieldset>` rather than a label and a control, because that is
 * what a group is: the legend names the question and the choices answer it. A group whose question was an
 * ordinary paragraph above it would leave a screen reader announcing three labels and no question.
 *
 * Everything that carries the wiring is shared with the other fields — the ids, the hint, the always-mounted
 * error — and only the frame differs.
 *
 * Native inputs rather than a primitive: the browser already gives a radio group its single tab stop, its arrow
 * keys and its wrap-around, and every reimplementation of that is a chance to get one of the three wrong.
 */
export function CheckboxField({
  label,
  hint,
  error,
  required,
  disabled,
  name,
  mode,
  layout,
  choices,
  hidden,
}: CheckboxFieldProps) {
  const ids = fieldIds(useId(), hint !== '')
  const invalid = error !== ''
  const radioStart = startingChoice(mode, choices)

  return (
    <div className={formBlockStyles({ hidden })} data-testid="checkbox-field">
      <fieldset
        aria-describedby={ids.describedBy}
        aria-invalid={invalid ? true : undefined}
        className={FIELD_GROUP}
        data-invalid={invalid}
        data-testid="field-control"
      >
        <legend className={FIELD_LEGEND}>
          {label}
          {required && <RequiredMark />}
        </legend>

        <div className={choiceListStyles({ layout })}>
          {choices.map((choice, index) => (
            <ChoiceRow
              checked={mode === 'radio' ? choice.value === radioStart : choice.checked}
              choice={choice}
              disabled={disabled}
              hintId={`${ids.fieldId}-choice-${index}-hint`}
              id={`${ids.fieldId}-choice-${index}`}
              key={choice.value}
              mode={mode}
              name={name}
              required={required}
            />
          ))}
        </div>

        <FieldHint hint={hint} id={ids.hintId} />
        <FieldError error={error} id={ids.errorId} />
      </fieldset>
    </div>
  )
}
