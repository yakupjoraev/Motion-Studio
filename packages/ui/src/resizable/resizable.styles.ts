import { type VariantProps, cva } from 'class-variance-authority'

import { FOCUS_RING, TRANSITION_CONTROL } from '../styles/variants'

/** The width is a custom property so a drag can write it without a render — contract § 5. */
export const resizableFrameStyles = cva([
  'relative flex w-[var(--ms-resizable-width)] min-w-0 shrink-0',
])

/** § Layout: 4 px line, 8 px hit area. `col-resize` is § Cursors' row for this handle. */
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

/** Invisible at rest: the panel edge is already a hairline. */
export const resizableLineStyles = cva([
  'w-[4px] bg-transparent group-hover:bg-border-strong group-focus-visible:bg-accent',
  TRANSITION_CONTROL,
])

export type ResizableStyleProps = VariantProps<typeof resizableHandleStyles>
