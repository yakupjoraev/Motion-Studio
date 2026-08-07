import { Z_INDEX } from '@motion-studio/tokens'
import { cn } from '@motion-studio/utils'
import * as RadixPopover from '@radix-ui/react-popover'
import type { ReactElement } from 'react'

import { popoverContentStyles } from './popover.styles'

import type { PopoverProps } from './popover.types'

/**
 * Radix Popover. Radix owns positioning, the outside-press and `Escape` dismissal, and returning focus to
 * the trigger; this file owns the surface, the name and the timing.
 *
 * Non-modal on purpose. An inspector popover — a colour picker, a preset list — sits beside the canvas and
 * the user is expected to keep working around it; trapping focus and inerting the page would make a picker
 * behave like a save dialog. `Dialog` is the component for the cases that do need that.
 *
 * No `forwardRef`: this renders no element of its own. The trigger is the caller's.
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
  // `exactOptionalPropertyTypes`: omit an absent prop rather than passing `undefined`, which Radix reads as
  // "uncontrolled".
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
