import { type VariantProps, cva } from 'class-variance-authority'

import { FLOATING_SURFACE } from '../styles/variants'

/**
 * The scrim. Not a token colour: it is a neutral dimming of whatever is behind it, and both modes want the
 * same black at the same opacity — a scrim that inverts with the theme stops reading as "behind".
 */
export const dialogScrimStyles = cva(['fixed inset-0 bg-black/50'])

/**
 * The panel. Widths are ADR-036 — the inspector's default, two of them, and the widest that fits the
 * studio's 1024 px minimum with a margin. All three are `max-w`, so a narrower window shrinks the dialog
 * instead of clipping it.
 *
 * `max-h` with the body scrolling inside is the one bound that is not about looks: a dialog taller than the
 * window puts its own buttons out of reach.
 */
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

/** `DESIGN_SYSTEM.md` § Typography: `sm` is the heading step above the chrome's `xs` body. */
export const dialogTitleStyles = cva(['font-medium text-foreground text-sm'])

export const dialogDescriptionStyles = cva(['text-foreground-muted text-xs'])

/** The body scrolls; the heading and the footer do not, so the actions stay reachable. */
export const dialogBodyStyles = cva(['min-h-0 flex-1 overflow-y-auto'])

export const dialogFooterStyles = cva(['flex shrink-0 items-center justify-end gap-2 pt-1'])

export type DialogStyleProps = VariantProps<typeof dialogContentStyles>
