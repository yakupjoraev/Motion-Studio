import { cn } from '@motion-studio/utils'
import { forwardRef } from 'react'

import { inputStyles, inputWrapperStyles, slotStyles } from './input.styles'

import type { InputProps } from './input.types'

/**
 * A 26 px field — `UI_GUIDELINES.md` § Density scale — with optional slots inside it.
 *
 * `invalid` sets `aria-invalid` as well as the border colour: § Accessibility in chrome requires that colour
 * is never the only signal.
 *
 * The ref forwards to the `input`, not to the wrapper, because that is what a caller means by "focus it".
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { prefix, suffix, invalid = false, disabled = false, className, ...rest },
  ref,
) {
  return (
    <div className={cn(inputWrapperStyles({ invalid, disabled }), className)}>
      {prefix === undefined ? null : <span className={slotStyles()}>{prefix}</span>}
      <input
        ref={ref}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={inputStyles()}
        {...rest}
      />
      {suffix === undefined ? null : <span className={slotStyles()}>{suffix}</span>}
    </div>
  )
})
