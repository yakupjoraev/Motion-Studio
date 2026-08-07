import { type VariantProps, cva } from 'class-variance-authority'

/** One step of value above the panel. The pulse is in `chrome.css`, on a token, so reduced motion stops it. */
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
