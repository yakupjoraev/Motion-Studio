import { type VariantProps, cva } from 'class-variance-authority'

/**
 * `surface-2` on the panels' `surface-1`: one step of value, the same step the segmented indicator uses.
 * The pulse is in `styles/chrome.css` so its duration comes from the token and stops under reduced motion.
 */
export const skeletonStyles = cva(['bg-surface-2'], {
  variants: {
    shape: {
      rect: 'rounded-sm',
      text: 'h-[10px] rounded-xs',
      circle: 'rounded-full',
    },
  },
  defaultVariants: { shape: 'rect' },
})

export type SkeletonStyleProps = VariantProps<typeof skeletonStyles>
