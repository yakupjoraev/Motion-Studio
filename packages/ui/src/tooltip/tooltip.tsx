import { Z_INDEX } from '@motion-studio/tokens'
import { cn } from '@motion-studio/utils'
import * as RadixTooltip from '@radix-ui/react-tooltip'
import type { ReactElement } from 'react'

import { Kbd } from '../kbd/index'

import { tooltipContentStyles } from './tooltip.styles'

import type { TooltipProps, TooltipProviderProps } from './tooltip.types'

/**
 * One per app. Radix uses it to keep the group warm: after the first 500 ms wait, moving along a toolbar
 * shows the rest immediately. Durations are § Timing's.
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
 * `label` names the trigger and the bubble is `aria-hidden` — ADR-035. No `forwardRef`: this renders no
 * element of its own.
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
  // `exactOptionalPropertyTypes`: an explicit `undefined` makes Radix treat the control as uncontrolled.
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
