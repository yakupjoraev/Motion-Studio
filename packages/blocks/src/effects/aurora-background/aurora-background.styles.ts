import { cva } from 'class-variance-authority'

/**
 * Three fields, three places. The sizes overlap deliberately: an aurora is one light with structure
 * inside it, and three fields that merely sit side by side read as three blobs.
 */
export const auroraFieldStyles = cva('ms-fx-field', {
  variants: {
    field: {
      a: '-left-[10%] -top-[20%] ms-fx-field-a h-[70%] w-[70%]',
      b: '-right-[15%] top-[5%] ms-fx-field-b h-[80%] w-[60%]',
      c: 'bottom-[-25%] left-[15%] ms-fx-field-c h-[75%] w-[80%]',
    },
  },
  defaultVariants: { field: 'a' },
})

export const auroraGrainStyles = 'ms-fx-noise absolute inset-0 mix-blend-overlay'
