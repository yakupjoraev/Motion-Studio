import { assertDefined, cn } from '@motion-studio/utils'
import * as RadixSlider from '@radix-ui/react-slider'
import { forwardRef } from 'react'

import {
  sliderRangeStyles,
  sliderRootStyles,
  sliderThumbStyles,
  sliderTrackStyles,
} from './slider.styles'

import type { SliderProps } from './slider.types'

/**
 * Radix reports an array because the same primitive serves range sliders. This unwraps it once, here, so
 * that twenty inspector rows do not each write `[value]` going in and `next[0]` coming out.
 *
 * `assertDefined` rather than a `if (next === undefined)` guard: the array always holds one element for a
 * one-thumb slider, so the guard would be a branch no test can reach — ADR-014 is the pattern.
 */
const unwrap =
  (handler: (value: number) => void) =>
  (values: number[]): void => {
    handler(assertDefined(values[0], 'a one-thumb slider reported no value'))
  }

/**
 * Radix Slider, narrowed to one value and given our well, fill and knob.
 *
 * The accessible name goes on the **thumb**, not on the root: the thumb is the element carrying
 * `role="slider"`, `aria-valuenow` and the arrow keys, and a name on the root would leave the control a
 * screen reader actually lands on unnamed.
 */
export const Slider = forwardRef<HTMLSpanElement, SliderProps>(function Slider(
  {
    value,
    defaultValue,
    onValueChange,
    onValueCommit,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    className,
    id,
    name,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-valuetext': ariaValueText,
  },
  ref,
) {
  // `exactOptionalPropertyTypes`: omit an absent prop rather than passing `undefined`, which Radix reads as
  // "uncontrolled" and which would make a controlled slider drift away from its own value.
  const rootProps = {
    ...(value === undefined ? {} : { value: [value] }),
    ...(defaultValue === undefined ? {} : { defaultValue: [defaultValue] }),
    ...(onValueChange === undefined ? {} : { onValueChange: unwrap(onValueChange) }),
    ...(onValueCommit === undefined ? {} : { onValueCommit: unwrap(onValueCommit) }),
    ...(name === undefined ? {} : { name }),
  }

  const thumbProps = {
    ...(ariaLabel === undefined ? {} : { 'aria-label': ariaLabel }),
    ...(ariaLabelledBy === undefined ? {} : { 'aria-labelledby': ariaLabelledBy }),
    ...(ariaValueText === undefined ? {} : { 'aria-valuetext': ariaValueText }),
  }

  return (
    <RadixSlider.Root
      ref={ref}
      id={id}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      orientation="horizontal"
      className={cn(sliderRootStyles(), className)}
      {...rootProps}
    >
      <RadixSlider.Track className={sliderTrackStyles()}>
        <RadixSlider.Range className={sliderRangeStyles()} />
      </RadixSlider.Track>
      <RadixSlider.Thumb className={sliderThumbStyles()} {...thumbProps} />
    </RadixSlider.Root>
  )
})
