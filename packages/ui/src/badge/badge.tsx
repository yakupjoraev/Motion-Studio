import { cn } from '@motion-studio/utils'
import { forwardRef } from 'react'

import { badgeStyles } from './badge.styles'

import type { BadgeProps } from './badge.types'

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone, children, className, ...rest },
  ref,
) {
  return (
    <span ref={ref} className={cn(badgeStyles({ tone }), className)} {...rest}>
      {children}
    </span>
  )
})
