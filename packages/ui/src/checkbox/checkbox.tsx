import { CheckIcon, MinusIcon } from '@motion-studio/icons'
import { cn } from '@motion-studio/utils'
import * as RadixCheckbox from '@radix-ui/react-checkbox'
import { forwardRef } from 'react'

import {
  checkboxBoxStyles,
  checkboxCheckStyles,
  checkboxDashStyles,
  checkboxIndicatorStyles,
  checkboxRootStyles,
} from './checkbox.styles'

import type { CheckboxProps } from './checkbox.types'

/** The box is a child because the root is the hit target and the box is the glyph (ADR-030). */
export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
  { checked, defaultChecked, onCheckedChange, className, ...rest },
  ref,
) {
  // `exactOptionalPropertyTypes`: an explicit `undefined` makes Radix treat the control as uncontrolled.
  const stateProps = {
    ...(checked === undefined ? {} : { checked }),
    ...(defaultChecked === undefined ? {} : { defaultChecked }),
    ...(onCheckedChange === undefined ? {} : { onCheckedChange }),
  }

  return (
    <RadixCheckbox.Root
      ref={ref}
      className={cn(checkboxRootStyles(), className)}
      {...stateProps}
      {...rest}
    >
      <span className={checkboxBoxStyles()}>
        {/* `hidden` removes the wrong mark from layout, so the survivor centres itself. */}
        <RadixCheckbox.Indicator className={checkboxIndicatorStyles()}>
          <CheckIcon className={checkboxCheckStyles()} />
          <MinusIcon className={checkboxDashStyles()} />
        </RadixCheckbox.Indicator>
      </span>
    </RadixCheckbox.Root>
  )
})
