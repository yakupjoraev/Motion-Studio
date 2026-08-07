import { cn } from '@motion-studio/utils'
import { forwardRef } from 'react'

import {
  emptyStateActionsStyles,
  emptyStateMessageStyles,
  emptyStateStyles,
} from './empty-state.styles'

import type { EmptyStateProps } from './empty-state.types'

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { message, action, hint, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn(emptyStateStyles(), className)} {...rest}>
      <p className={emptyStateMessageStyles()}>{message}</p>
      {action === undefined && hint === undefined ? null : (
        <div className={emptyStateActionsStyles()}>
          {action}
          {hint}
        </div>
      )}
    </div>
  )
})
