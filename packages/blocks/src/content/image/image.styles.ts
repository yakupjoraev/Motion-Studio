import { cva } from 'class-variance-authority'

export const imageFrameStyles = cva('relative w-full overflow-hidden bg-surface-2', {
  variants: {
    aspect: {
      auto: '',
      square: 'aspect-square',
      video: 'aspect-video',
      portrait: 'aspect-[3/4]',
      wide: 'aspect-[21/9]',
    },
    radius: {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full',
    },
  },
})

export const imageStyles = cva('block h-full w-full', {
  variants: {
    fit: {
      cover: 'object-cover',
      contain: 'object-contain',
    },
    /** With no fixed aspect the intrinsic ratio governs, and a stretched height would fight it. */
    aspect: {
      auto: 'h-auto',
      square: '',
      video: '',
      portrait: '',
      wide: '',
    },
  },
})

export const imageFigureStyles = cva('m-0 flex flex-col gap-2', {
  variants: {
    hidden: { true: 'hidden', false: 'flex' },
  },
})

export const IMAGE_CAPTION = 'text-foreground-subtle text-sm'

/** The empty state: a plate at the chosen ratio, so dropping the block does not collapse the layout. */
export const IMAGE_EMPTY =
  'flex h-full min-h-24 w-full items-center justify-center border border-border border-dashed text-foreground-subtle text-xs'
