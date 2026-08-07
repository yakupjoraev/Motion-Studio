import { ChevronRightIcon } from '@motion-studio/icons'
import { cn } from '@motion-studio/utils'
import * as RadixCollapsible from '@radix-ui/react-collapsible'
import { forwardRef } from 'react'

import {
  collapsibleContentStyles,
  collapsibleHeaderStyles,
  collapsibleIndicatorStyles,
  collapsibleRootStyles,
  collapsibleTriggerStyles,
} from './collapsible.styles'

import type { CollapsibleProps } from './collapsible.types'

/** Open state is the caller's: `ui` never touches `localStorage`, and where it persists is the app's call. */
export const Collapsible = forwardRef<HTMLDivElement, CollapsibleProps>(function Collapsible(
  {
    trigger,
    action,
    children,
    open,
    defaultOpen,
    onOpenChange,
    disabled = false,
    className,
    triggerClassName,
    contentClassName,
  },
  ref,
) {
  // `exactOptionalPropertyTypes`: omit an absent prop rather than passing `undefined`.
  const rootProps = {
    ...(open === undefined ? {} : { open }),
    ...(defaultOpen === undefined ? {} : { defaultOpen }),
    ...(onOpenChange === undefined ? {} : { onOpenChange }),
  }

  return (
    <RadixCollapsible.Root
      ref={ref}
      disabled={disabled}
      className={cn(collapsibleRootStyles(), className)}
      {...rootProps}
    >
      <div className={collapsibleHeaderStyles()}>
        {/* `group` so the chevron can read `data-state`: uncontrolled, the section does not know its own. */}
        <RadixCollapsible.Trigger className={cn(collapsibleTriggerStyles(), triggerClassName)}>
          <ChevronRightIcon size={12} className={collapsibleIndicatorStyles()} />
          {trigger}
        </RadixCollapsible.Trigger>
        {action}
      </div>

      <RadixCollapsible.Content
        data-ms-collapsible=""
        className={cn(collapsibleContentStyles(), contentClassName)}
      >
        {children}
      </RadixCollapsible.Content>
    </RadixCollapsible.Root>
  )
})
