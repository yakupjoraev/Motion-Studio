import { cn } from '@motion-studio/utils'
import * as RadixSeparator from '@radix-ui/react-separator'
import { forwardRef } from 'react'

import { separatorStyles } from './separator.styles'

import type { SeparatorProps } from './separator.types'

export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(function Separator(
  { orientation = 'horizontal', decorative = true, className, ...rest },
  ref,
) {
  return (
    <RadixSeparator.Root
      ref={ref}
      orientation={orientation}
      decorative={decorative}
      className={cn(separatorStyles({ orientation }), className)}
      {...rest}
    />
  )
})
