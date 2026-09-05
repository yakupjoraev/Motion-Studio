import { cva } from 'class-variance-authority'

/**
 * The typography, in one place, because it is the whole game. Three things carry the character and
 * none of them is colour:
 *
 *   - the headline is `display-1` — `clamp(2.5rem, 6vw, 5rem)` at −0.03em, which is the tracking
 *     DESIGN_SYSTEM.md § Typography assigns the token. It is tighter than Tailwind's `tracking-tight`
 *     (−0.025em), so the token is left to do the job rather than being overridden by a utility;
 *   - the rhythm is 24 / 24 / 40 px, written as a top margin on each element with `first:mt-0` on the
 *     headline, so a hero with no eyebrow starts flush instead of carrying a phantom gap;
 *   - the measure is capped independently of the band. A subtitle at 42rem stays readable at 1440 px,
 *     which is the difference between a hero and a wall of text.
 */
export const heroCopyStyles = cva('flex w-full flex-col', {
  variants: {
    align: {
      start: 'items-start text-left',
      center: 'items-center text-center',
      end: 'items-end text-right',
    },
  },
})

export const heroEyebrowStyles = cva('m-0 font-medium text-xs uppercase tracking-[0.12em]', {
  variants: {
    eyebrowStyle: {
      pill: 'inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent-muted px-3 py-1 text-accent',
      plain: 'text-foreground-subtle',
    },
  },
})

/** The dot inside the pill. Decorative, so it is a span with no text rather than a character. */
export const HERO_EYEBROW_DOT = 'size-1.5 shrink-0 rounded-full bg-accent'

/**
 * Two display steps, and which one a hero uses is a layout fact rather than a preference: `display-1`
 * is `clamp(2.5rem, 6vw, 5rem)`, sized for a headline that owns the full measure. Put it in a half
 * -width column and a four-word line becomes four lines — measured at 1440 px, where the split heroes
 * broke to four. `display-2` is the step for a column, and it is the one every two-column hero passes.
 */
export const heroHeadlineStyles = cva(
  'mt-6 mb-0 max-w-[20ch] text-balance font-semibold text-foreground first:mt-0',
  {
    variants: {
      headlineSize: {
        'display-1': 'text-display-1',
        'display-2': 'text-display-2',
      },
    },
  },
)

export const heroSubtitleStyles = cva('mt-6 mb-0 max-w-2xl text-pretty text-foreground-muted', {
  variants: {
    size: {
      md: 'text-lg',
      lg: 'text-lg @min-[768px]/frame:text-xl',
    },
  },
})

export const heroActionsStyles = cva('mt-10 flex flex-wrap items-center gap-3', {
  variants: {
    align: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
    },
  },
})

/**
 * The CTA. `h-12` and 16 px text because a hero button is content, not chrome — the studio's own
 * density stops at the canvas edge. The focus ring is declared here rather than inherited from the
 * app's base layer, so the exported project keeps it.
 */
export const heroActionStyles = cva(
  [
    'inline-flex h-12 items-center justify-center gap-2 rounded-md px-6 font-medium text-md',
    'no-underline transition-colors [transition-duration:var(--ms-duration-fast)]',
    'focus-visible:outline-2 focus-visible:outline-accent-ring focus-visible:outline-offset-2',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: 'bg-accent text-foreground-onAccent shadow-md hover:bg-accent-hover',
        // `surface-2` rather than `surface-1`: measured against the band, a button one step off the
        // page background needs its own value, not only a hairline, or it reads as floating text.
        secondary:
          'border border-border-strong bg-surface-2 text-foreground shadow-xs hover:bg-surface-3',
        ghost: 'px-3 text-foreground-muted hover:text-foreground',
      },
    },
  },
)

export const heroTrustStyles = cva(
  'mt-8 mb-0 flex list-none flex-wrap items-center gap-x-5 gap-y-2 p-0 text-foreground-subtle text-xs uppercase tracking-[0.12em]',
  {
    variants: {
      align: {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
      },
    },
  },
)

/**
 * The band. Padding steps are the section's, so a hero and a section below it share a rhythm.
 *
 * `@container/frame` is what makes the steps mean anything in the studio — ADR-356. A `md:` here is a
 * query against the browser window, and the artboard is a 375 px box drawn inside a 1920 px window,
 * so the mobile frame was laying out with desktop padding. Against the frame's own width the answer
 * is the same one the exported page gives, because the section carries the container with it.
 */
export const heroSectionStyles = cva('@container/frame relative flex w-full flex-col', {
  variants: {
    padding: {
      none: 'p-0',
      xs: 'p-2',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-10 @min-[768px]/frame:p-16',
      xl: 'px-6 py-16 @min-[768px]/frame:px-16 @min-[768px]/frame:py-24 @min-[1024px]/frame:py-32',
    },
    minHeight: {
      auto: '',
      half: 'min-h-[50svh]',
      'three-quarters': 'min-h-[75svh]',
      screen: 'min-h-svh',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
    },
    hidden: { true: 'hidden', false: 'flex' },
  },
})

/**
 * The measure is always centred in the band and `align` only decides where the *text* sits inside it.
 * A section may reasonably hug the left edge; a hero may not — measured at 1440 px, a left-aligned
 * hero on `max-w-screen-lg` left 400 px of dead margin on the right and the whole band read as
 * misaligned rather than as deliberately ranged left.
 */
export const heroInnerStyles = cva('relative z-10 mx-auto flex w-full flex-col', {
  variants: {
    maxWidth: {
      sm: 'max-w-screen-sm',
      md: 'max-w-screen-md',
      lg: 'max-w-screen-lg',
      xl: 'max-w-screen-xl',
      full: 'max-w-none',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
    },
  },
})
