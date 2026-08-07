import { type VariantProps, cva } from 'class-variance-authority'

export const separatorStyles = cva(['shrink-0 bg-border'], {
  variants: {
    orientation: {
      horizontal: 'h-px w-full',
      vertical: 'h-full w-px',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
})

export type SeparatorStyleProps = VariantProps<typeof separatorStyles>
