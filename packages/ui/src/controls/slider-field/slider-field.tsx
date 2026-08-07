import { cn } from '@motion-studio/utils'
import { type ReactElement, memo } from 'react'

import { Slider } from '../../slider/index'
import { controlLabelProps } from '../control-row/index'
import { ScrubField } from '../scrub-field/index'
import { precisionOfStep, speakValue } from '../scrub-field/index'

import type { SliderFieldProps } from './slider-field.types'

/**
 * Slider and number are one control over one value — § Control rows draws them on the same line. The
 * slider's drag is `onValueChange` per step and `onValueCommit` on release, which is the same
 * transient contract the number half honours.
 *
 * Only the number half takes the row's `id`: two elements cannot share one, and the number is what a
 * caller means by "focus the control".
 */
function SliderFieldImpl({
  value,
  onChange,
  onCommit,
  label,
  labelledBy,
  describedBy,
  id,
  disabled = false,
  mixed = false,
  min = 0,
  max = 100,
  step = 1,
  unit,
  precision,
  className,
}: SliderFieldProps): ReactElement {
  const decimals = precision ?? precisionOfStep(step)

  return (
    <span className={cn('flex min-w-0 flex-1 items-center gap-2', className)}>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="min-w-0 flex-1"
        aria-valuetext={mixed ? 'Mixed' : speakValue(value, decimals, unit)}
        onValueChange={onChange}
        onValueCommit={onCommit}
        {...controlLabelProps(label, labelledBy)}
      />
      <ScrubField
        id={id}
        label={label}
        labelledBy={labelledBy}
        describedBy={describedBy}
        value={value}
        min={min}
        max={max}
        step={step}
        unit={unit}
        precision={decimals}
        disabled={disabled}
        mixed={mixed}
        onChange={onChange}
        onCommit={onCommit}
        className="w-[56px] shrink-0"
      />
    </span>
  )
}

export const SliderField = memo(SliderFieldImpl)
