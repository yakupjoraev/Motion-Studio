import { cva } from 'class-variance-authority'

/**
 * The rows. `gap-16 @min-[1024px]/frame:gap-24` between them, which is one step below the section's own padding — close
 * enough that two rows read as one section, far enough that they do not read as one row.
 */
export const FEATURE_SPLIT_ROWS = 'flex flex-col gap-16 @min-[1024px]/frame:gap-24'

/**
 * A row is one column below `lg` and two above it, and the media takes the second column. Reversing a
 * row moves the media with `order`, not with the DOM: reading order stays copy-then-picture on every
 * row, which is what keeps a screen reader's path and the tab order consistent down an alternating
 * section. CSS carries the visual swap because that is the half a sighted reader is served by.
 */
export const featureSplitMediaStyles = cva('min-w-0', {
  variants: {
    reversed: { true: '@min-[1024px]/frame:order-first', false: '' },
  },
})

export const FEATURE_SPLIT_ROW =
  'grid items-center gap-8 @min-[1024px]/frame:grid-cols-2 @min-[1024px]/frame:gap-16'

export const FEATURE_SPLIT_COPY = 'flex min-w-0 flex-col'

export const FEATURE_SPLIT_EYEBROW =
  'm-0 font-medium text-accent text-xs uppercase tracking-[0.12em]'

/** Two display steps down from a hero: a headline at `display-1` in a half-width column breaks to four lines. */
export const FEATURE_SPLIT_TITLE =
  'mt-4 mb-0 max-w-[22ch] text-balance font-semibold text-2xl text-foreground first:mt-0 @min-[768px]/frame:text-3xl'

export const FEATURE_SPLIT_BODY = 'mt-4 mb-0 max-w-prose text-pretty text-foreground-muted text-lg'
