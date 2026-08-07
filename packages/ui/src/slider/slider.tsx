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

/** Radix works in arrays because it also serves range sliders. `assertDefined` per ADR-014. */
const unwrap =
  (handler: (value: number) => void) =>
  (values: number[]): void => {
    handler(assertDefined(values[0], 'a one-thumb slider reported no value'))
  }

/** The name goes on the thumb: that is the `role="slider"`, not the root. */
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
  // `exactOptionalPropertyTypes`: an explicit `undefined` makes Radix treat the control as uncontrolled.
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
