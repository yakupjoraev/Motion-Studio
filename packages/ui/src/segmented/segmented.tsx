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
 * RadioGroup, not ToggleGroup: § Inspector wants `role="radiogroup"` with arrow keys, and only RadioGroup
 * gives radio semantics and roving tabindex together. The indicator is one `layoutId` span.
 */
export const Segmented = forwardRef<HTMLDivElement, SegmentedProps>(function Segmented(
  { value, defaultValue, onValueChange, options, disabled = false, className, ...aria },
  ref,
) {
  // Radix keeps the uncontrolled selection in a context this component does not subscribe to, so the
  // indicator needs its own copy or it never leaves the segment it started on.
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const selected = value ?? uncontrolled

  const handleValueChange = (next: string): void => {
    setUncontrolled(next)
    onValueChange?.(next)
  }

  // `exactOptionalPropertyTypes`: an explicit `undefined` makes Radix treat the control as uncontrolled.
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
