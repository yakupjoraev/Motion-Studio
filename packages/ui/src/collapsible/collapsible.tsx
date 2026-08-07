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

/**
 * Radix Collapsible dressed as an inspector section — § Section headers. Radix owns `aria-expanded`,
 * `aria-controls`, the Space and Enter path, and measuring the content so its height can be animated at all.
 *
 * Open state is the caller's: `ui` never touches `localStorage`. Two sections with the same key on one page
 * would fight over it, and where the state is persisted is an application decision, not a chrome one.
 */
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
        {/* The trigger is a `group` so the chevron can read its `data-state` — the section does not know
            its own openness when the caller leaves it uncontrolled. */}
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
