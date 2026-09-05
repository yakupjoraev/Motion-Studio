import { cva } from 'class-variance-authority'

/**
 * The band and the section header, in one place because they are the page's rhythm and a page whose
 * sections breathe differently reads as assembled from parts.
 *
 * Three numbers carry it, all from DESIGN_SYSTEM.md § Space:
 *
 *   - vertical padding `py-16 @min-[768px]/frame:py-24 @min-[1024px]/frame:py-32` — the section rhythm the document states;
 *   - the measure: the band is `max-w-6xl`, the header's description is `max-w-2xl` inside it. A
 *     description that spans the band is the specific thing that makes a marketing page look like a
 *     document rather than a product;
 *   - the header-to-content gap is `mt-12 @min-[768px]/frame:mt-16`, one step larger than anything inside the header,
 *     so the header reads as a unit rather than as the first row of the content.
 */
/**
 * `@container/frame` — ADR-356. Every step below is a question about how wide this band is, and a
 * `@min-[768px]/frame:` asks the browser window instead: inside the studio's artboard those are different numbers,
 * and the mobile frame was answering with the desktop's.
 */
export const marketingSectionStyles = cva('@container/frame w-full', {
  variants: {
    hidden: { true: 'hidden', false: 'block' },
    padding: {
      none: 'py-0',
      compact: 'py-12 @min-[768px]/frame:py-16',
      default: 'py-16 @min-[768px]/frame:py-24 @min-[1024px]/frame:py-32',
    },
  },
})

/** The measure inside the band. `px-6` at 360 px is the smallest gutter that does not look clipped. */
export const MARKETING_INNER = 'mx-auto w-full max-w-6xl px-6'

/** A full-bleed band still needs its content inside the measure — the CTA banner is the case. */
export const MARKETING_INNER_WIDE = 'mx-auto w-full max-w-7xl px-6'

export const sectionHeaderStyles = cva('flex w-full flex-col', {
  variants: {
    headingAlign: {
      start: 'items-start text-left',
      center: 'items-center text-center',
      end: 'items-end text-right',
    },
  },
})

/**
 * The eyebrow is `accent` on a muted plate rather than plain small caps, and the difference is
 * measured rather than felt: DESIGN_SYSTEM.md § The three curves puts `foreground-subtle` at the
 * bottom of the contrast contract, and a 11 px uppercase line at that value is legible but invisible —
 * it stops doing the job an eyebrow exists for, which is to be read first.
 */
export const SECTION_EYEBROW =
  'm-0 font-medium text-accent text-xs uppercase tracking-[0.12em] [font-variant-numeric:tabular-nums]'

/**
 * `text-balance` and a `24ch` measure, so a five-word heading breaks 3/2 rather than 4/1. The tracking
 * comes from the token — DESIGN_SYSTEM.md § Typography assigns `2xl` −0.015em and `4xl` −0.025em — and
 * is deliberately not overridden by a utility.
 */
export const sectionHeadingStyles = cva(
  'mt-4 mb-0 max-w-[24ch] text-balance font-semibold text-foreground first:mt-0',
  {
    variants: {
      size: {
        /** For a band that is proof rather than a claim — a logo row, a compact CTA. */
        md: 'text-2xl @min-[768px]/frame:text-3xl',
        /**
         * `display-2`, which DESIGN_SYSTEM.md § Typography assigns to exactly this: "Fluid section".
         * `clamp(2rem, 4.5vw, 3.5rem)` at −0.02em, so a section headline is 32 px on a phone and 56 px at
         * 1440 without a breakpoint in the class. Measured beside the reference at 1440, the earlier pair
         * (`text-3xl @min-[768px]/frame:text-4xl`, capping at 48 px) read a step quieter than the page around it.
         */
        lg: 'text-display-2',
      },
    },
  },
)

export const SECTION_DESCRIPTION = 'mt-4 mb-0 max-w-2xl text-pretty text-foreground-muted text-lg'

/** The gap between the header and whatever the section shows. Absent header, absent gap. */
export const SECTION_CONTENT = 'mt-12 w-full @min-[768px]/frame:mt-16'

/**
 * The one transition every hoverable marketing surface uses. The duration is a token, so the studio's
 * `--ms-reduced-motion: 0` override and the media query both collapse it to nothing (ADR-021) — which
 * is why no block here writes `transition-duration` as a number.
 */
export const MARKETING_TRANSITION =
  'transition-[color,background-color,border-color,box-shadow,transform] [transition-duration:var(--ms-duration-fast)] [transition-timing-function:var(--ms-ease-standard)]'

/** ACCESSIBILITY.md § Focus, declared on the block rather than inherited, so the export keeps it. */
export const MARKETING_FOCUS =
  'focus-visible:outline-2 focus-visible:outline-accent-ring focus-visible:outline-offset-2'

/**
 * The call-to-action button, and it is the marketing category's own rather than the hero's — for the
 * reason `actionSchema` states: reaching it through `hero/index` would pull six hero blocks into this
 * category's module graph. Same geometry as the hero's, because a CTA is a CTA: `h-12` and 16 px text,
 * which is content density rather than chrome density.
 */
export const actionStyles = cva(
  [
    'inline-flex h-12 items-center justify-center gap-2 rounded-md px-6 font-medium text-md no-underline',
    MARKETING_TRANSITION,
    MARKETING_FOCUS,
  ].join(' '),
  {
    variants: {
      variant: {
        primary: 'bg-accent text-foreground-onAccent shadow-md hover:bg-accent-hover',
        secondary:
          'border border-border-strong bg-surface-2 text-foreground shadow-xs hover:bg-surface-3',
        ghost: 'px-3 text-foreground-muted hover:text-foreground',
      },
    },
  },
)

/**
 * The variant a button takes on a band that is already the accent colour. A primary button on an accent
 * background is invisible; the surface colour becomes the loud one, which is the inversion every good
 * CTA band uses.
 */
export const actionOnAccentStyles = cva('', {
  variants: {
    variant: {
      primary:
        'border border-transparent bg-surface-0 text-foreground shadow-md hover:bg-surface-1',
      // A tint as well as the hairline: on the band, a transparent secondary beside a filled primary reads
      // as a link somebody forgot to style rather than as the second of two choices.
      secondary:
        'border border-foreground-onAccent/35 bg-foreground-onAccent/10 text-foreground-onAccent hover:bg-foreground-onAccent/20',
      ghost: 'text-foreground-onAccent/80 hover:text-foreground-onAccent',
    },
  },
})

export const actionRowStyles = cva('flex flex-wrap items-center gap-3', {
  variants: {
    align: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
    },
  },
})
