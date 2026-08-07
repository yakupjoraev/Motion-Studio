import { type VariantProps, cva } from 'class-variance-authority'

import { FLOATING_SURFACE } from '../styles/variants'

/** Fixed, not absolute: a toast reports on the document and must not scroll away with a panel. */
export const toastViewportStyles = cva([
  'fixed right-4 bottom-4 flex w-[320px] max-w-[calc(100vw-32px)] flex-col gap-2 outline-none',
])

/** Tone on the left edge, not across the card: a red card reads as an error, not as a confirmation. */
export const toastStyles = cva(
  [FLOATING_SURFACE, 'flex items-start gap-3 border-l-2 p-3 text-xs text-foreground'],
  {
    variants: {
      tone: {
        neutral: 'border-l-border-strong',
        danger: 'border-l-danger',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export const toastTitleStyles = cva(['font-medium text-foreground text-xs'])

export const toastDescriptionStyles = cva(['text-foreground-muted text-2xs'])

export type ToastStyleProps = VariantProps<typeof toastStyles>
