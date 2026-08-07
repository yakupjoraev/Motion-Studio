import { cn } from '@motion-studio/utils'
import * as RadixRadioGroup from '@radix-ui/react-radio-group'
import { motion } from 'motion/react'
import { forwardRef, useState } from 'react'

import {
  segmentedIndicatorStyles,
  segmentedItemStyles,
  segmentedRootStyles,
} from './segmented.styles'

import type { SegmentedProps } from './segmented.types'

/**
 * A segmented control. Built on Radix **RadioGroup**, not ToggleGroup: `ACCESSIBILITY.md` § Inspector
 * requires `role="radiogroup"` with arrow navigation, and RadioGroup is the primitive that gives radio
 * semantics, roving tabindex and arrow keys together. The segments are styling over that.
 *
 * The indicator is a Motion `layoutId`: one element moves between segments rather than each segment fading
 * its own background in and out, which is what makes the movement read as a physical slide. § Timing puts a
 * tab-style indicator at 200 ms `standard` and calls it a layout animation.
 *
 * Reduced motion is not special-cased. `layout` transitions honour `prefers-reduced-motion` through Motion's
 * own reducedMotion handling, and the duration is the token, which carries both motion factors (ADR-021).
 */
export const Segmented = forwardRef<HTMLDivElement, SegmentedProps>(function Segmented(
  { value, defaultValue, onValueChange, options, disabled = false, className, ...aria },
  ref,
) {
  /*
   * The indicator is rendered from `selected`, so this component needs to know the selection even when the
   * caller does not control it. Radix keeps the uncontrolled selection in its own context and this component
   * does not subscribe to it, so without the copy below the group would re-render inside Radix, this
   * function would not, and the indicator would sit under the segment it started on forever.
   */
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const selected = value ?? uncontrolled

  const handleValueChange = (next: string): void => {
    setUncontrolled(next)
    onValueChange?.(next)
  }

  // `exactOptionalPropertyTypes`: an absent prop is omitted, never passed as `undefined`.
  const rootProps = {
    ...(value === undefined ? {} : { value }),
    ...(defaultValue === undefined ? {} : { defaultValue }),
  }

  return (
    <RadixRadioGroup.Root
      ref={ref}
      disabled={disabled}
      orientation="horizontal"
      loop
      className={cn(segmentedRootStyles(), className)}
      onValueChange={handleValueChange}
      {...rootProps}
      {...aria}
    >
      {options.map((option) => {
        const isSelected = option.value === selected

        return (
          <RadixRadioGroup.Item
            key={option.value}
            value={option.value}
            aria-label={option.label}
            {...(option.disabled === undefined ? {} : { disabled: option.disabled })}
            className={segmentedItemStyles({ selected: isSelected })}
          >
            {isSelected ? (
              <motion.span
                layoutId="ms-segmented-indicator"
                className={segmentedIndicatorStyles()}
                style={{ left: 0, right: 0 }}
                transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              />
            ) : null}
            <span className="relative z-10">{option.content}</span>
          </RadixRadioGroup.Item>
        )
      })}
    </RadixRadioGroup.Root>
  )
})
