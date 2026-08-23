import { XIcon } from '@motion-studio/icons'
import { Z_INDEX } from '@motion-studio/tokens'
import { cn } from '@motion-studio/utils'
import * as RadixDialog from '@radix-ui/react-dialog'
import { type ReactElement, useEffect, useRef, useState } from 'react'

import { Button } from '../button/index'

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
 * `title` and `description` are required props, not optional slots: ACCESSIBILITY.md § Dialogs wants both
 * `aria-labelledby` and `aria-describedby` on every dialog. Sizes are ADR-036.
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
  /*
   * ACCESSIBILITY.md § Dialogs: focus returns where it came from. Radix restores whatever was active
   * when its content mounted, and for a dialog opened from a store flag or a keyboard shortcut that is
   * already `body` — measured on this primitive, with the shortcut sheet and the export dialog both
   * landing on `body`. So the element is tracked while the dialog is closed and restored explicitly.
   */
  const previous = useRef<HTMLElement | null>(null)
  const [uncontrolled, setUncontrolled] = useState(defaultOpen ?? false)
  const visible = open ?? uncontrolled

  useEffect(() => {
    if (visible) {
      return
    }

    const record = (event: FocusEvent): void => {
      if (event.target instanceof HTMLElement) {
        previous.current = event.target
      }
    }

    document.addEventListener('focusin', record)

    return () => document.removeEventListener('focusin', record)
  }, [visible])

  // `exactOptionalPropertyTypes`: omit an absent prop rather than passing `undefined`.
  const rootProps = {
    ...(open === undefined ? {} : { open }),
    ...(defaultOpen === undefined ? {} : { defaultOpen }),
    onOpenChange: (next: boolean) => {
      setUncontrolled(next)
      onOpenChange?.(next)
    },
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
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            previous.current?.focus()
          }}
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
