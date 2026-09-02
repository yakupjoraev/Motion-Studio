import { XIcon } from '@motion-studio/icons'
import { Z_INDEX } from '@motion-studio/tokens'
import { cn } from '@motion-studio/utils'
import * as RadixDialog from '@radix-ui/react-dialog'
import { type ReactElement, useLayoutEffect, useRef, useState } from 'react'

import { Button } from '../button/index'

import {
  dialogBodyStyles,
  dialogContentStyles,
  dialogDescriptionStyles,
  dialogFooterStyles,
  dialogScrimStyles,
  dialogTitleStyles,
} from './dialog.styles'
import { focusReturnTarget, watchFocusReturn } from './focus-return'

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
  const [uncontrolled, setUncontrolled] = useState(defaultOpen ?? false)
  const visible = open ?? uncontrolled
  const previous = useRef<HTMLElement | null>(null)

  /*
   * ACCESSIBILITY.md § Dialogs: focus returns to the control that opened this — ADR-325. Captured in
   * a layout effect, which runs before the focus scope's own effect moves focus into the dialog, and
   * skipped when the control is inside another overlay: a dialog opened from a menu item returns to
   * the menu's trigger, because the item itself is gone by then.
   */
  useLayoutEffect(() => {
    watchFocusReturn()

    if (!visible) {
      return
    }

    const active = document.activeElement

    /*
     * `body` is not a control that opened anything — it is what an engine leaves behind when a menu
     * closes without restoring its trigger, and returning focus to it is the very failure ADR-325
     * exists to prevent. Treated as "nothing had focus", so the recorded control is used instead.
     */
    previous.current =
      active instanceof HTMLElement &&
      active !== document.body &&
      active.closest('[data-ms-overlay]') === null
        ? active
        : focusReturnTarget()
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
            // Radix would focus its `Trigger`, which these dialogs do not have, and prevent the focus
            // scope's own restore on the way — so the return is ours to make.
            event.preventDefault()
            ;(previous.current ?? focusReturnTarget())?.focus()
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
