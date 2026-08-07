import { cn } from '@motion-studio/utils'
import * as RadixLabel from '@radix-ui/react-label'
import { forwardRef } from 'react'

import { labelStyles } from './label.styles'

import type { LabelProps } from './label.types'

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { children, required = false, className, ...rest },
  ref,
) {
  return (
    <RadixLabel.Root ref={ref} className={cn(labelStyles(), className)} {...rest}>
      {children}
      {required ? (
        <span aria-hidden className="pl-0.5 text-danger">
          *
        </span>
      ) : null}
      {required ? <span className="sr-only"> (required)</span> : null}
    </RadixLabel.Root>
  )
})
