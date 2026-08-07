import { cn } from '@motion-studio/utils'
import { forwardRef } from 'react'

import { buttonStyles } from './button.styles'

import type { ButtonProps } from './button.types'

/** `type="button"` by default: a form button that submits when nobody asked is the usual defect here. */
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
