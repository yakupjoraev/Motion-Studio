import { cva } from 'class-variance-authority'

import { MARKETING_TRANSITION } from '../marketing.styles'

/** The grid. Two tracks on a phone whatever the column count, because six marks in a row is four too many. */
export const logoGridStyles = cva('grid list-none items-center gap-x-10 gap-y-8 p-0', {
  variants: {
    columns: {
      2: 'grid-cols-2',
      3: 'grid-cols-2 @min-[640px]/frame:grid-cols-3',
      4: 'grid-cols-2 @min-[640px]/frame:grid-cols-4',
      5: 'grid-cols-2 @min-[640px]/frame:grid-cols-3 @min-[1024px]/frame:grid-cols-5',
      6: 'grid-cols-2 @min-[640px]/frame:grid-cols-3 @min-[1024px]/frame:grid-cols-6',
    },
  },
})

/**
 * **Sizes normalised**, which is the whole difficulty of a logo cloud: real marks arrive at wildly
 * different proportions, and setting a width makes a tall mark tiny while a wide one overflows. Capping
 * the *height* and letting width follow with `object-contain` is what makes a wordmark and a roundel read
 * as the same weight.
 */
export const LOGO_BOX = 'flex h-10 items-center justify-center'

export const logoImageStyles = cva(
  ['max-h-8 w-auto max-w-[140px] object-contain', MARKETING_TRANSITION].join(' '),
  {
    variants: {
      grayscale: {
        // Opacity as well as saturation: grayscale alone leaves a black mark blacker than the text
        // beside it, which is the row reading as a stack of holes.
        true: 'opacity-70 grayscale hover:opacity-100 hover:grayscale-0',
        false: '',
      },
    },
  },
)

/** The word-mark that stands in until a file arrives — and a real answer for a text-only logo row. */
export const logoWordStyles = cva(
  ['font-semibold text-lg tracking-tight', MARKETING_TRANSITION].join(' '),
  {
    variants: {
      grayscale: {
        true: 'text-foreground-subtle hover:text-foreground',
        false: 'text-foreground',
      },
    },
  },
)

export const LOGO_MARQUEE_ITEM = 'shrink-0 px-8'
