import { cva } from 'class-variance-authority'

import { INTERACTIVE_FOCUS, INTERACTIVE_TRANSITION } from '../interactive.styles'

/** One slide's share of the track. A literal class per value, because Tailwind needs to see it (ADR-106). */
export const SLIDE_BASIS: Readonly<Record<1 | 2 | 3 | 4, string>> = {
  1: 'basis-full',
  2: 'basis-full sm:basis-1/2',
  3: 'basis-full sm:basis-1/2 lg:basis-1/3',
  4: 'basis-full sm:basis-1/2 lg:basis-1/4',
}

export const carouselRootStyles = cva('w-full min-w-0', {
  variants: { hidden: { true: 'hidden', false: 'block' } },
  defaultVariants: { hidden: false },
})

/**
 * The scroller itself. Six declarations and no JavaScript: `snap-x snap-mandatory` gives the browser the
 * gesture, `overflow-x-auto` gives it the scrollbar, and `scrollbar-none` hides the bar without taking the
 * scrolling away — the arrows and the dots are the visible affordance instead.
 *
 * `-mx-1 px-1` is for the focus ring: a slide focused at the edge of the scroller would have its ring clipped
 * by `overflow`, and the padding is what leaves room for it.
 */
export const CAROUSEL_TRACK = [
  'flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth',
  '-mx-1 px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
].join(' ')

export const CAROUSEL_SLIDE = [
  'flex min-w-0 shrink-0 grow-0 snap-start flex-col gap-2 rounded-lg border border-border bg-surface-1 p-5',
  INTERACTIVE_FOCUS,
].join(' ')

export const SLIDE_TITLE = 'm-0 font-medium text-foreground text-md tracking-tight'

export const CAROUSEL_CONTROLS = 'mt-4 flex items-center justify-between gap-4'

export const CAROUSEL_ARROWS = 'flex items-center gap-2'

export const CAROUSEL_DOTS = 'm-0 flex list-none items-center gap-2 p-0'

/**
 * A dot. 24 px of hit area around an 8 px mark, so the target is real while the mark stays a dot — and the
 * current one is a longer bar rather than only a brighter colour.
 */
export const CAROUSEL_DOT = [
  'inline-flex size-6 items-center justify-center rounded-full',
  INTERACTIVE_TRANSITION,
  INTERACTIVE_FOCUS,
].join(' ')

export const carouselDotMarkStyles = cva(
  ['block h-2 rounded-full', INTERACTIVE_TRANSITION].join(' '),
  {
    variants: {
      current: { true: 'w-5 bg-accent', false: 'w-2 bg-border-strong' },
    },
    defaultVariants: { current: false },
  },
)
