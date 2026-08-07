import { Z_INDEX } from '@motion-studio/tokens'
import { cn } from '@motion-studio/utils'
import * as RadixPopover from '@radix-ui/react-popover'
import type { ReactElement } from 'react'

import { popoverContentStyles } from './popover.styles'

import type { PopoverProps } from './popover.types'

/**
 * Non-modal on purpose: an inspector popover sits beside the canvas and the user keeps working around it.
 * `Dialog` is the component for the cases that need a trap. No `forwardRef`: this renders no element.
 */
export function Popover({
  trigger,
  children,
  label,
  side = 'bottom',
  align = 'start',
  open,
  defaultOpen,
  onOpenChange,
  className,
}: PopoverProps): ReactElement {
  // `exactOptionalPropertyTypes`: an explicit `undefined` makes Radix treat the control as uncontrolled.
  const rootProps = {
    ...(open === undefined ? {} : { open }),
    ...(defaultOpen === undefined ? {} : { defaultOpen }),
    ...(onOpenChange === undefined ? {} : { onOpenChange }),
  }

  return (
    <RadixPopover.Root {...rootProps}>
      <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>

      <RadixPopover.Portal>
        <RadixPopover.Content
          side={side}
          align={align}
          sideOffset={4}
          collisionPadding={8}
          aria-label={label}
          data-ms-overlay=""
          style={{ zIndex: Z_INDEX.popover }}
          className={cn(popoverContentStyles(), className)}
        >
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  )
}
