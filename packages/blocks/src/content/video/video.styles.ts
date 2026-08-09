import { cva } from 'class-variance-authority'

export const videoFrameStyles = cva('relative w-full overflow-hidden bg-surface-inset', {
  variants: {
    aspect: {
      video: 'aspect-video',
      square: 'aspect-square',
      portrait: 'aspect-[3/4]',
      wide: 'aspect-[21/9]',
    },
    radius: {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
    },
  },
})

export const videoFigureStyles = cva('m-0 flex flex-col gap-2', {
  variants: {
    hidden: { true: 'hidden', false: 'flex' },
  },
})

export const VIDEO_ELEMENT = 'block h-full w-full object-cover'

export const VIDEO_CAPTION = 'text-foreground-subtle text-sm'

export const VIDEO_EMPTY =
  'flex h-full w-full items-center justify-center border border-border border-dashed text-foreground-subtle text-xs'
