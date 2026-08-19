import { CHOICE_HINT, CHOICE_INPUT, CHOICE_LABEL, CHOICE_ROW } from '../forms.styles'

import type { Choice, ChoiceMode } from './checkbox-field.schema'

export interface ChoiceRowProps {
  readonly choice: Choice
  readonly mode: ChoiceMode
  readonly name: string
  readonly id: string
  readonly hintId: string
  readonly checked: boolean
  readonly required: boolean
  readonly disabled: boolean
}

/**
 * One choice: a native input, its own label, and an optional line under it.
 *
 * Native `<input type="checkbox">` and `<input type="radio">` rather than a primitive, and that is the first rule
 * of ARIA rather than a shortcut: the browser already gives a radio group its roving tab stop, its arrow keys and
 * its wrap-around, and every custom implementation of that is a chance to get one of the three wrong.
 *
 * The choice's own hint is wired to the input with `aria-describedby`, so it belongs to this row rather than to
 * the group — a description on the fieldset would be read before every choice in it.
 */
export function ChoiceRow({
  choice,
  mode,
  name,
  id,
  hintId,
  checked,
  required,
  disabled,
}: ChoiceRowProps) {
  const hasHint = choice.hint !== ''

  return (
    <div className={CHOICE_ROW} data-testid="choice-row">
      <input
        aria-required={required ? true : undefined}
        className={CHOICE_INPUT}
        data-testid="choice-input"
        defaultChecked={checked}
        disabled={disabled || choice.disabled}
        id={id}
        name={name}
        type={mode}
        value={choice.value}
        {...(hasHint ? { 'aria-describedby': hintId } : {})}
      />

      <span className="flex min-w-0 flex-col gap-1">
        <label className={CHOICE_LABEL} htmlFor={id}>
          {choice.label}
        </label>
        {hasHint && (
          <p className={CHOICE_HINT} id={hintId}>
            {choice.hint}
          </p>
        )}
      </span>
    </div>
  )
}
