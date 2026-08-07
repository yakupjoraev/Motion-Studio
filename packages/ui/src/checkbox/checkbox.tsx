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

/**
 * Radix Checkbox with our box and mark. Radix owns `role="checkbox"`, `aria-checked` — including `mixed` for
 * the indeterminate state — the Space key, and the hidden input that makes it submit with a form.
 *
 * The box is a child of the root for the same reason as in `Switch`: the root is the 24 × 24 hit target and
 * the box is the 16 × 16 glyph, and those are two different sizes on purpose (ADR-030).
 */
export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
  { checked, defaultChecked, onCheckedChange, className, ...rest },
  ref,
) {
  // `exactOptionalPropertyTypes`: omit an absent prop rather than passing `undefined`, which Radix reads as
  // "uncontrolled".
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
        {/* Both marks are rendered; `hidden` takes the wrong one out of the layout, so the survivor is the
            grid's only child and centres itself without any stacking. */}
        <RadixCheckbox.Indicator className={checkboxIndicatorStyles()}>
          <CheckIcon className={checkboxCheckStyles()} />
          <MinusIcon className={checkboxDashStyles()} />
        </RadixCheckbox.Indicator>
      </span>
    </RadixCheckbox.Root>
  )
})
