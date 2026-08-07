import { type VariantProps, cva } from 'class-variance-authority'

import { FOCUS_RING, TRANSITION_CONTROL } from '../styles/variants'

export const scrollAreaRootStyles = cva(['relative overflow-hidden'])

/** The viewport is a tab stop once its content overflows. */
export const scrollAreaViewportStyles = cva(['h-full w-full', FOCUS_RING])

/** Overlay, not inline: a panel's width must not depend on whether a section overflowed. */
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

/** Neutral: a scrollbar reports a position, it does not carry a value, so ADR-032 does not apply. */
export const scrollAreaThumbStyles = cva([
  'relative flex-1 rounded-full bg-border-strong hover:bg-foreground-subtle',
  TRANSITION_CONTROL,
])

export type ScrollAreaStyleProps = VariantProps<typeof scrollAreaScrollbarStyles>
