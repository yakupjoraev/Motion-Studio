import { MinusIcon, PlusIcon } from '@motion-studio/icons'
import { clamp, cn } from '@motion-studio/utils'
import { type KeyboardEvent, type ReactElement, memo } from 'react'

import { Button } from '../../button/index'
import { controlLabelProps } from '../control-row/index'
import { precisionOfStep, speakValue } from '../scrub-field/index'
import { stepperFieldStyles, stepperValueStyles } from './stepper-field.styles'

import type { StepperFieldProps } from './stepper-field.types'

/**
 * The WAI-ARIA spinbutton pattern: the value is the focusable control and carries the state, the two
 * buttons are pointer affordances kept out of the tab order but still named, so a screen reader user
 * hears "Increase columns" rather than an unlabelled plus.
 */
function StepperFieldImpl({
  value,
  onChange,
  onCommit,
  label,
  labelledBy,
  describedBy,
  id,
  disabled = false,
  mixed = false,
  min,
  max,
  step = 1,
  unit,
  precision,
  className,
}: StepperFieldProps): ReactElement {
  const decimals = precision ?? precisionOfStep(step)
  const bounded = (next: number): number =>
    clamp(next, min ?? -Number.MAX_VALUE, max ?? Number.MAX_VALUE)

  const settle = (next: number): void => {
    if (next !== value) {
      onChange(next)
      onCommit(next)
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>): void => {
    const direction = event.key === 'ArrowUp' ? 1 : event.key === 'ArrowDown' ? -1 : 0

    if (direction !== 0) {
      event.preventDefault()
      settle(bounded(value + direction * step))
    }
  }

  return (
    <span className={cn(stepperFieldStyles(), className)}>
      <Button
        variant="ghost"
        size="icon"
        tabIndex={-1}
        disabled={disabled || (min !== undefined && value <= min)}
        aria-label={`Decrease ${label}`}
        onClick={() => settle(bounded(value - step))}
      >
        <MinusIcon size={12} />
      </Button>

      {/* biome-ignore lint/a11y/useSemanticElements: no element expresses `spinbutton`; an `input` here would offer a caret the stepper does not have. */}
      <span
        id={id}
        role="spinbutton"
        tabIndex={disabled ? -1 : 0}
        aria-valuenow={mixed ? undefined : value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={mixed ? 'Mixed' : speakValue(value, decimals, unit)}
        aria-disabled={disabled || undefined}
        aria-describedby={describedBy}
        className={stepperValueStyles()}
        onKeyDown={onKeyDown}
        {...controlLabelProps(label, labelledBy)}
      >
        {mixed ? 'Mixed' : `${value.toFixed(decimals)}${unit ?? ''}`}
      </span>

      <Button
        variant="ghost"
        size="icon"
        tabIndex={-1}
        disabled={disabled || (max !== undefined && value >= max)}
        aria-label={`Increase ${label}`}
        onClick={() => settle(bounded(value + step))}
      >
        <PlusIcon size={12} />
      </Button>
    </span>
  )
}

export const StepperField = memo(StepperFieldImpl)
