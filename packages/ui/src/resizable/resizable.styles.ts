import { type VariantProps, cva } from 'class-variance-authority'

import { FOCUS_RING, TRANSITION_CONTROL } from '../styles/variants'

/**
 * The frame reads its width from a custom property rather than from a React style object: a drag writes to
 * that property directly, so the panel follows the pointer without a render (contract § 5).
 */
export const resizableFrameStyles = cva([
  'relative flex w-[var(--ms-resizable-width)] min-w-0 shrink-0',
])

/**
 * § Layout: "the handle is 4 px wide with an 8 px hit area". The visible line is 4 px, and the 8 px target is
 * the element itself — a 4 px pointer target is a miss waiting to happen.
 *
 * `col-resize` is § Cursors' row for a panel resize handle.
 */
export const resizableHandleStyles = cva(
  [
    'group absolute inset-y-0 z-20 flex w-[8px] cursor-col-resize touch-none items-stretch justify-center',
    FOCUS_RING,
  ],
  {
    variants: {
      side: {
        // Centred on the edge, so the hit area straddles it rather than sitting inside the panel.
        left: '-left-[4px]',
        right: '-right-[4px]',
      },
    },
    defaultVariants: { side: 'right' },
  },
)

/**
 * The line inside the handle. Invisible until the pointer or focus arrives — § Character keeps the chrome
 * quiet, and a panel edge that is already a hairline does not need a second one drawn over it at rest.
 */
export const resizableLineStyles = cva([
  'w-[4px] bg-transparent group-hover:bg-border-strong group-focus-visible:bg-accent',
  TRANSITION_CONTROL,
])

export type ResizableStyleProps = VariantProps<typeof resizableHandleStyles>
