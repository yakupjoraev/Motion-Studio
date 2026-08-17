import { cva } from 'class-variance-authority'

/**
 * Two columns above `lg`, stacked below it, and the copy is the wider of the two: a form column that grows
 * with the page ends up with a 600 px email field, which reads as a mistake rather than as generosity.
 * `3fr 2fr` keeps the field around 420 px at 1440.
 */
export const CTA_SPLIT_GRID = 'grid items-center gap-10 lg:grid-cols-[3fr_2fr] lg:gap-16'

export const ctaSplitPanelStyles = cva('rounded-2xl px-6 py-12 md:px-10 md:py-14', {
  variants: {
    surface: {
      surface: 'border border-border bg-surface-1 shadow-sm',
      glass: 'ms-glass shadow-lg',
      plain: 'px-0 py-0',
    },
  },
})

export const CTA_SPLIT_COPY = 'flex min-w-0 flex-col'

export const CTA_SPLIT_EYEBROW = 'm-0 font-medium text-accent text-xs uppercase tracking-[0.12em]'

export const CTA_SPLIT_HEADING =
  'mt-4 mb-0 max-w-[24ch] text-balance font-semibold text-2xl text-foreground first:mt-0 md:text-3xl'

export const CTA_SPLIT_DESCRIPTION =
  'mt-4 mb-0 max-w-prose text-pretty text-foreground-muted text-lg'

/** The action side. Left-aligned on a stack, so the buttons line up with the copy above them. */
export const CTA_SPLIT_SIDE = 'flex min-w-0 flex-col'
