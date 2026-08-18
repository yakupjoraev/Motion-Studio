import { z } from 'zod'

import { headingLevel } from '../../marketing/marketing.schema'
import { labelledFrameFields, panelItemSchema } from '../interactive.schema'

export const MAX_SLIDES = 8
export const MIN_SLIDES = 2

/** How many slides are in view at once. Past four a slide is narrower than its own text at 1440 px. */
export const MIN_PER_VIEW = 1
export const MAX_PER_VIEW = 4

/**
 * WCAG 2.2.2 in numbers: a moving carousel a reader cannot keep up with is a failure, and three seconds is
 * the floor at which a slide of two lines can be read. The pause control is not optional either way.
 */
export const MIN_AUTOPLAY_INTERVAL = 3000
export const MAX_AUTOPLAY_INTERVAL = 10_000
export const AUTOPLAY_INTERVAL_STEP = 500

export const carouselSchema = z.object({
  slides: z
    .array(panelItemSchema)
    .min(MIN_SLIDES)
    .max(MAX_SLIDES)
    .default([
      {
        label: 'Canvas',
        icon: 'grid',
        body: 'An infinite artboard with real components on it, at any zoom.',
      },
      {
        label: 'Inspector',
        icon: 'settings',
        body: 'Generated from each block’s own schema, so a new prop is a new control.',
      },
      {
        label: 'Motion',
        icon: 'zap',
        body: 'Presets per channel, composed rather than stacked, reduced-motion correct.',
      },
      {
        label: 'Export',
        icon: 'export',
        body: 'React, Next, or plain HTML — the same tree, with Tailwind classes.',
      },
    ]),
  perView: z.number().int().min(MIN_PER_VIEW).max(MAX_PER_VIEW).default(2),
  arrows: z.boolean().default(true),
  dots: z.boolean().default(true),
  /** Off, and deliberately: WCAG 2.2.2, and a page that moves on arrival is a page that moved without asking. */
  autoplay: z.boolean().default(false),
  autoplayInterval: z
    .number()
    .int()
    .min(MIN_AUTOPLAY_INTERVAL)
    .max(MAX_AUTOPLAY_INTERVAL)
    .default(5000),
  /** The level a slide's own title prints at, so a strip inside a section does not skip one. */
  headingLevel: headingLevel.default(3),
  ...labelledFrameFields('Highlights'),
})

export type CarouselProps = z.infer<typeof carouselSchema>

/** "3 of 7" — the position is the label, because a slide has no other way to say where it is. */
export const slidePosition = (index: number, count: number): string => `${index + 1} of ${count}`

export const goToSlideLabel = (index: number): string => `Go to slide ${index + 1}`

/** The last index that can be scrolled to: past it the track has nothing left to reveal. */
export const lastIndex = (count: number, perView: number): number =>
  Math.max(0, count - Math.max(1, perView))

/** Wraps, because an autoplay that stopped at the end would be a slideshow that ran once. */
export const nextIndex = (index: number, count: number, perView: number): number =>
  index >= lastIndex(count, perView) ? 0 : index + 1
