import { type VariantProps, cva } from 'class-variance-authority'

import { FLOATING_SURFACE } from '../styles/variants'

/** Not a token colour: both modes want the same black, or the scrim stops reading as "behind". */
export const dialogScrimStyles = cva(['fixed inset-0 bg-black/50'])

/** Widths are ADR-036. `max-h` matters: a dialog taller than the window puts its own buttons out of reach. */
export const dialogContentStyles = cva(
  [
    'fixed top-1/2 left-1/2 flex w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col',
    'max-h-[calc(100vh-64px)] gap-3 p-4 text-xs text-foreground',
    FLOATING_SURFACE,
  ],
  {
    variants: {
      size: {
        sm: 'max-w-[320px]',
        md: 'max-w-[640px]',
        lg: 'max-w-[960px]',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

/** `sm` is the heading step above the chrome's `xs` body. */
export const dialogTitleStyles = cva(['font-medium text-foreground text-sm'])

export const dialogDescriptionStyles = cva(['text-foreground-muted text-xs'])

/** Only the body scrolls, so the actions stay reachable. */
export const dialogBodyStyles = cva(['min-h-0 flex-1 overflow-y-auto'])

export const dialogFooterStyles = cva(['flex shrink-0 items-center justify-end gap-2 pt-1'])

export type DialogStyleProps = VariantProps<typeof dialogContentStyles>
