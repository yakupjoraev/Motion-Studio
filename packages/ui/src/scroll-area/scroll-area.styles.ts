import { type VariantProps, cva } from 'class-variance-authority'

import { FOCUS_RING, TRANSITION_CONTROL } from '../styles/variants'

export const scrollAreaRootStyles = cva(['relative overflow-hidden'])

/** The viewport is the tab stop when its content overflows, so it carries the ring like anything focusable. */
export const scrollAreaViewportStyles = cva(['h-full w-full', FOCUS_RING])

/**
 * An overlay scrollbar: it sits on top of the content rather than taking a column from it, which is what
 * keeps a 280 px panel 280 px wide whether or not it happens to overflow.
 *
 * 8 px wide with a 2 px inset leaves a 4 px thumb — the same 4 px the slider's well and the panel's resize
 * handle use (§ Layout), so the three thinnest things in the chrome are one width.
 */
export const scrollAreaScrollbarStyles = cva(
  ['flex touch-none select-none p-[2px]', TRANSITION_CONTROL],
  {
    variants: {
      orientation: {
        vertical: 'h-full w-[8px]',
        horizontal: 'w-full flex-col h-[8px]',
      },
      scrollbars: {
        hover: 'opacity-0 hover:opacity-100 data-[state=visible]:opacity-100',
        always: 'opacity-100',
      },
    },
    defaultVariants: { orientation: 'vertical', scrollbars: 'hover' },
  },
)

/**
 * The thumb. `border-strong` rather than `foreground`: a scrollbar reports where you are, it does not carry
 * a value, so ADR-032's inversion does not apply and § Character's "everything else is neutral" does.
 */
export const scrollAreaThumbStyles = cva([
  'relative flex-1 rounded-full bg-border-strong hover:bg-foreground-subtle',
  TRANSITION_CONTROL,
])

export type ScrollAreaStyleProps = VariantProps<typeof scrollAreaScrollbarStyles>
