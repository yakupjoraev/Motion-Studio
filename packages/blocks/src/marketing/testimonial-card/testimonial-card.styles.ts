import { cva } from 'class-variance-authority'

import { MARKETING_TRANSITION } from '../marketing.styles'

/**
 * The card is the container-query scope (`capabilities.containerQuery`, ADR-184). This is the block
 * RESPONSIVE_ENGINE.md names first, and the reason is what it gets used for: the same testimonial sits in
 * a full-width band, in a three-column grid, and in a bento cell. Its quote should be 20 px in the first
 * and 16 px in the last, and the viewport cannot tell those three apart.
 */
export const testimonialCardStyles = cva(
  ['@container relative flex flex-col rounded-xl @md:p-8 p-6', MARKETING_TRANSITION].join(' '),
  {
    variants: {
      treatment: {
        plain: '',
        card: 'border border-border bg-surface-1 shadow-sm',
        glass: 'ms-glass shadow-md',
      },
      hidden: { true: 'hidden', false: 'flex' },
    },
  },
)

/** Each piece carries its own bottom margin, so a card missing one of them has no phantom gap. */
export const TESTIMONIAL_EYEBROW =
  'mt-0 mb-4 font-medium text-accent text-xs uppercase tracking-[0.12em]'

/** The company mark. Height-capped and width-free, so marks of different proportions read as equals. */
export const TESTIMONIAL_LOGO = 'mb-6 h-6 w-auto max-w-[140px] object-contain opacity-80'

/**
 * `text-pretty` and a measure in characters rather than in pixels: a pull quote is judged on the shape of
 * its last line, and 44ch is where a two-sentence quote stops breaking one word onto a line of its own.
 */
export const TESTIMONIAL_QUOTE =
  'm-0 max-w-[44ch] text-pretty font-medium text-foreground text-lg leading-relaxed @md:text-xl'

/**
 * `mt-auto` rather than a fixed top margin: in a row of cards stretched to the tallest one — a marquee row,
 * a three-column grid — the attribution sits on the bottom edge of every card instead of trailing its own
 * quote, which is what makes a row of testimonials read as a row.
 */
export const TESTIMONIAL_FOOTER = 'mt-auto flex items-center gap-3 pt-6'

export const TESTIMONIAL_AVATAR = 'size-10 shrink-0 rounded-full object-cover'

export const TESTIMONIAL_INITIAL =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent-muted font-semibold text-accent text-sm'

export const TESTIMONIAL_AUTHOR = 'font-medium text-foreground text-base'

export const TESTIMONIAL_ROLE = 'text-foreground-muted text-base'
