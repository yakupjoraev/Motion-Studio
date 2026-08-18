import { z } from 'zod'

import {
  BODY_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  controlSize,
  controlVariant,
  interactiveFrameFields,
} from '../interactive.schema'

export const TITLE_MAX_LENGTH = 96
export const DESCRIPTION_MAX_LENGTH = 240

/** How wide the dialog is inside its frame — and, in the export, on the page. */
export const DIALOG_SIZES = ['sm', 'md', 'lg'] as const

export type DialogSize = (typeof DIALOG_SIZES)[number]

/** The caption on the frame. Structural rather than a prop: it says what the frame *is*. */
export const PREVIEW_LABEL = 'Dialog preview'

export const modalTriggerSchema = z.object({
  triggerLabel: z.string().min(1).max(LABEL_MAX_LENGTH).default('Open the dialog'),
  triggerVariant: controlVariant.default('secondary'),
  triggerSize: controlSize.default('md'),
  /** Both are required, because ACCESSIBILITY.md § Dialogs wants aria-labelledby *and* aria-describedby. */
  title: z.string().min(1).max(TITLE_MAX_LENGTH).default('Invite your team'),
  description: z
    .string()
    .min(1)
    .max(DESCRIPTION_MAX_LENGTH)
    .default('They will get an email with a link that expires in seven days.'),
  /** Shown in the dialog until a block is dropped into it — ADR-206. */
  body: z
    .string()
    .max(BODY_MAX_LENGTH)
    .default('Drop a form, a list, or anything else into this slot.'),
  closeLabel: z.string().min(1).max(LABEL_MAX_LENGTH).default('Close'),
  size: z.enum(DIALOG_SIZES).default('md'),
  /**
   * Whether the dialog starts open. `false` by default, because in the **export** this is a page that opens
   * with a dialog over it; the palette thumbnail sets it true, which is what `previewProps` is for.
   */
  defaultOpen: z.boolean().default(false),
  ...interactiveFrameFields(),
})

export type ModalTriggerProps = z.infer<typeof modalTriggerSchema>
