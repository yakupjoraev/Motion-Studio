import { Z_INDEX } from '@motion-studio/tokens'
import { cn } from '@motion-studio/utils'
import * as RadixTooltip from '@radix-ui/react-tooltip'
import type { ReactElement } from 'react'

import { Kbd } from '../kbd/kbd'

import { tooltipContentStyles } from './tooltip.styles'

import type { TooltipProps, TooltipProviderProps } from './tooltip.types'

/**
 * One provider per app, mounted in the studio shell. Radix uses it to keep the group "warm": after the first
 * tooltip has waited its 500 ms, moving along a toolbar shows the next one immediately, which is the
 * difference between a hint and an obstacle.
 *
 * The two durations are § Timing's, applied here rather than at each call site so that a `Tooltip` in a
 * dialog and a `Tooltip` in the toolbar cannot behave differently.
 */
export function TooltipProvider({
  children,
  delayDuration = 500,
  skipDelayDuration = 300,
}: TooltipProviderProps): ReactElement {
  return (
    <RadixTooltip.Provider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
      {children}
    </RadixTooltip.Provider>
  )
}

/**
 * Radix Tooltip. Radix owns the delay, the pointer and focus triggers, dismissal on `Escape`, and the
 * portal; this file owns the surface, the shortcut column and the naming.
 *
 * `label` becomes the trigger's `aria-label` and the bubble is `aria-hidden` — ADR-035. That is what stops
 * the name and the hint from drifting apart, and what keeps an icon button from being announced twice.
 *
 * There is no `forwardRef` here: this component renders no element of its own. The ref belongs to the child,
 * which the caller already holds.
 */
export function Tooltip({
  label,
  shortcut,
  children,
  side = 'top',
  align = 'center',
  open,
  defaultOpen,
  onOpenChange,
  className,
}: TooltipProps): ReactElement {
  // `exactOptionalPropertyTypes`: omit an absent prop rather than passing `undefined`, which Radix reads as
  // "uncontrolled".
  const rootProps = {
    ...(open === undefined ? {} : { open }),
    ...(defaultOpen === undefined ? {} : { defaultOpen }),
    ...(onOpenChange === undefined ? {} : { onOpenChange }),
  }

  return (
    <RadixTooltip.Root {...rootProps}>
      {/* `asChild` merges these onto the caller's element, so the trigger is their button and not a wrapper
          around it — a wrapper would put a non-interactive node in the tab order's way. */}
      <RadixTooltip.Trigger asChild aria-label={label}>
        {children}
      </RadixTooltip.Trigger>

      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          align={align}
          sideOffset={6}
          aria-hidden
          data-ms-overlay="tooltip"
          style={{ zIndex: Z_INDEX.tooltip }}
          className={cn(tooltipContentStyles(), className)}
        >
          {label}
          {shortcut === undefined ? null : <Kbd keys={shortcut} />}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
}
