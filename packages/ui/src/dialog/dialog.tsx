import { XIcon } from '@motion-studio/icons'
import { Z_INDEX } from '@motion-studio/tokens'
import { cn } from '@motion-studio/utils'
import * as RadixDialog from '@radix-ui/react-dialog'
import type { ReactElement } from 'react'

import { Button } from '../button/button'

import {
  dialogBodyStyles,
  dialogContentStyles,
  dialogDescriptionStyles,
  dialogFooterStyles,
  dialogScrimStyles,
  dialogTitleStyles,
} from './dialog.styles'

import type { DialogProps } from './dialog.types'

/**
 * Radix Dialog. Radix owns the focus trap, the restore to the trigger, `Escape`, and marking the background
 * `aria-hidden` — `ACCESSIBILITY.md` § Dialogs asks for all four and says not to reimplement them.
 *
 * What this file adds: the sizes (ADR-036), the 220 ms `emphasized` entrance § Timing gives dialogs and
 * nothing else, and the wiring that makes `aria-labelledby` and `aria-describedby` impossible to omit — both
 * are required props rather than optional slots.
 *
 * The close button carries a real label rather than an icon alone, which is the other thing § Dialogs lists.
 */
export function Dialog({
  trigger,
  title,
  description,
  children,
  footer,
  size = 'md',
  open,
  defaultOpen,
  onOpenChange,
  className,
}: DialogProps): ReactElement {
  // `exactOptionalPropertyTypes`: omit an absent prop rather than passing `undefined`.
  const rootProps = {
    ...(open === undefined ? {} : { open }),
    ...(defaultOpen === undefined ? {} : { defaultOpen }),
    ...(onOpenChange === undefined ? {} : { onOpenChange }),
  }

  return (
    <RadixDialog.Root {...rootProps}>
      {trigger === undefined ? null : <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}

      <RadixDialog.Portal>
        <RadixDialog.Overlay
          data-ms-scrim=""
          style={{ zIndex: Z_INDEX.dialog }}
          className={dialogScrimStyles()}
        />
        <RadixDialog.Content
          data-ms-overlay="dialog"
          style={{ zIndex: Z_INDEX.dialog }}
          className={cn(dialogContentStyles({ size }), className)}
        >
          <div className="flex items-start gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <RadixDialog.Title className={dialogTitleStyles()}>{title}</RadixDialog.Title>
              <RadixDialog.Description className={dialogDescriptionStyles()}>
                {description}
              </RadixDialog.Description>
            </div>
            <RadixDialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close">
                <XIcon />
              </Button>
            </RadixDialog.Close>
          </div>

          {children === undefined ? null : <div className={dialogBodyStyles()}>{children}</div>}
          {footer === undefined ? null : <div className={dialogFooterStyles()}>{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
