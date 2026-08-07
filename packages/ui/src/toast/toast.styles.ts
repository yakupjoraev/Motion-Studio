import { type VariantProps, cva } from 'class-variance-authority'

import { FLOATING_SURFACE } from '../styles/variants'

/**
 * Bottom-right, above everything but the command palette. Fixed rather than absolute: a toast reports on the
 * document and must not scroll away with the panel that caused it.
 */
export const toastViewportStyles = cva([
  'fixed right-4 bottom-4 flex w-[320px] max-w-[calc(100vw-32px)] flex-col gap-2 outline-none',
])

/**
 * A floating surface, like the overlays. The tone is carried by the left edge rather than by the whole
 * surface: § Character allows one accent and keeps the chrome neutral, and a fully red card for "Deleted
 * Hero · Undo" would read as an error rather than as a confirmation of what the user just asked for.
 */
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
