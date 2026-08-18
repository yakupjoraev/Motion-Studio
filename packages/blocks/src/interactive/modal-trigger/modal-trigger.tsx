'use client'

import { XIcon } from '@motion-studio/icons'
import * as Dialog from '@radix-ui/react-dialog'
import { useState } from 'react'

import { controlStyles } from '../interactive.styles'
import { PanelContent, panelChildren } from '../panel-content'

import { PREVIEW_LABEL } from './modal-trigger.schema'
import {
  MODAL_BODY,
  MODAL_CLOSE,
  MODAL_DESCRIPTION,
  MODAL_FRAME,
  MODAL_FRAME_EMPTY,
  MODAL_FRAME_LABEL,
  MODAL_OVERLAY,
  MODAL_PREVIEW,
  MODAL_TITLE,
  modalContentStyles,
  modalRootStyles,
} from './modal-trigger.styles'
import type { ModalTriggerProps } from './modal-trigger.types'

/**
 * A button and a real Radix dialog — portalled into the block's **own frame** rather than to the document
 * body, which is ADR-205 and the answer to a requirement that looks contradictory.
 *
 * A modal cannot cover the canvas, and a block must not know it is in a canvas. `Dialog.Portal` takes a
 * container, so given the frame below it the overlay and the content render inside this block as
 * absolutely-positioned children — and every behaviour stays Radix's and unchanged: focus is trapped in the
 * content, `Esc` closes it, focus returns to the trigger, and the rest of the page is `aria-hidden` while it
 * is open. Nothing here varies by host: the same tree renders in the canvas, in Storybook, in jsdom, and on
 * the user's page.
 *
 * **The export is the one place this differs.** Prompt 43's React printer portals to the document body and
 * drops the frame, so an exported dialog covers the viewport like a dialog should. The codegen descriptor
 * says so above the element rather than leaving the reader to notice.
 *
 * While the dialog is open, everything outside it is `aria-hidden` — **except** a live region: `hideOthers`
 * adds every `[aria-live]` element to its keep set, so the announcer ACCESSIBILITY.md § Dialogs insists on
 * stays reachable and the block's own test asserts both halves (ADR-209).
 */
export function ModalTrigger({
  triggerLabel,
  triggerVariant,
  triggerSize,
  title,
  description,
  body,
  closeLabel,
  size,
  defaultOpen,
  hidden,
  children,
}: ModalTriggerProps) {
  // State rather than a ref: `Dialog.Portal` needs the element on the render that mounts the content, and a
  // ref would still be null then.
  const [frame, setFrame] = useState<HTMLDivElement | null>(null)
  const slotted = panelChildren(children)

  return (
    <Dialog.Root defaultOpen={defaultOpen}>
      <div className={modalRootStyles({ hidden })} data-testid="modal-trigger">
        <Dialog.Trigger
          className={controlStyles({ variant: triggerVariant, size: triggerSize })}
          data-testid="modal-trigger-button"
        >
          {triggerLabel}
        </Dialog.Trigger>

        <div className={MODAL_PREVIEW}>
          <p className={MODAL_FRAME_LABEL}>{PREVIEW_LABEL}</p>

          <div className={MODAL_FRAME} data-testid="modal-frame" ref={setFrame}>
            <p className={MODAL_FRAME_EMPTY}>{title}</p>

            {frame !== null && (
              <Dialog.Portal container={frame}>
                <Dialog.Overlay className={MODAL_OVERLAY} data-testid="modal-overlay" />
                <Dialog.Content
                  className={modalContentStyles({ size })}
                  data-testid="modal-content"
                >
                  <Dialog.Title className={MODAL_TITLE}>{title}</Dialog.Title>
                  <Dialog.Description className={MODAL_DESCRIPTION}>
                    {description}
                  </Dialog.Description>

                  <div className={MODAL_BODY}>
                    <PanelContent body={body} child={slotted.length > 0 ? children : undefined} />
                  </div>

                  <Dialog.Close
                    aria-label={closeLabel}
                    className={MODAL_CLOSE}
                    data-testid="modal-close"
                  >
                    <XIcon aria-hidden="true" size={18} />
                  </Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            )}
          </div>
        </div>
      </div>
    </Dialog.Root>
  )
}
