import { cn } from '@motion-studio/utils'
import { forwardRef } from 'react'

import { buttonStyles } from './button.styles'

import type { ButtonProps } from './button.types'

/**
 * The chrome's button. `type="button"` by default: a button inside a form that submits when nobody asked is
 * the most common defect in a component like this, and the caller can still pass `type="submit"`.
 *
 * Unknown props spread to the root and the ref forwards, so a caller adds `data-*` or ARIA attributes
 * without this file growing a prop for each.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, leadingIcon, trailingIcon, className, type = 'button', children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonStyles({ variant, size }), className)}
      {...rest}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  )
})
