import { cva } from 'class-variance-authority'

/**
 * One column below `lg`, two above it. The text half always comes first in the DOM regardless of
 * which side it is painted on, so the reading order on a phone is headline before picture and the
 * `order` utilities only ever move the *painted* position — § Rules 5 and ACCESSIBILITY.md § Order.
 */
export const heroSplitGridStyles = cva('grid w-full items-center gap-10 lg:gap-16', {
  variants: {
    ratio: {
      even: 'lg:grid-cols-2',
      'text-wide': 'lg:grid-cols-[1.25fr_1fr]',
      'media-wide': 'lg:grid-cols-[1fr_1.25fr]',
    },
  },
})

export const heroSplitTextStyles = cva('min-w-0', {
  variants: {
    reverse: { true: 'lg:order-2', false: 'lg:order-1' },
  },
})

export const heroSplitMediaStyles = cva('min-w-0', {
  variants: {
    reverse: { true: 'lg:order-1', false: 'lg:order-2' },
  },
})

/**
 * The plate. A hairline plus a large radius plus a diffuse shadow is the whole recipe — the border is
 * what keeps the edge findable on a surface the same value as the plate, which is the case in dark
 * mode and the reason a shadow alone is not enough.
 */
export const heroSplitFrameStyles = cva('w-full overflow-hidden', {
  variants: {
    mediaFrame: {
      true: 'rounded-2xl border border-border bg-surface-1 shadow-xl',
      false: '',
    },
    mediaAspect: {
      auto: '',
      square: 'aspect-square',
      video: 'aspect-video',
      portrait: 'aspect-[3/4]',
    },
  },
})

export const heroSplitSurfaceStyles = cva('overflow-hidden', {
  variants: {
    background: {
      transparent: 'bg-transparent',
      'surface-0': 'bg-surface-0',
      'surface-1': 'bg-surface-1',
      'surface-2': 'bg-surface-2',
    },
  },
})
