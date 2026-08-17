import { cva } from 'class-variance-authority'

/**
 * The band. It is the one marketing block that paints edge to edge, so it is a `<section>` with its own
 * inner measure rather than a card inside one — `fullWidth: true` in the capabilities says so.
 *
 * `rounded-2xl` on the panel and not on the section: a full-bleed band with rounded corners shows the page
 * through them, which reads as a mistake. The panel sits inside the measure and rounds; the section does
 * not.
 */
export const ctaPanelStyles = cva(
  'relative overflow-hidden rounded-2xl px-6 py-14 md:px-12 md:py-20',
  {
    variants: {
      surface: {
        gradient: 'ms-cta-gradient',
        accent: 'bg-accent',
        glass: 'ms-glass shadow-lg',
        surface: 'border border-border bg-surface-1 shadow-sm',
      },
    },
  },
)

export const ctaCopyStyles = cva('mx-auto flex max-w-3xl flex-col', {
  variants: {
    align: {
      start: 'items-start text-left',
      center: 'items-center text-center',
      end: 'items-end text-right',
    },
  },
})

export const ctaEyebrowStyles = cva('m-0 font-medium text-xs uppercase tracking-[0.12em]', {
  variants: {
    onAccent: {
      true: 'text-foreground-onAccent/75',
      false: 'text-accent',
    },
  },
})

/**
 * `display-2` rather than `display-1`: a CTA band is not the page's opening statement, and a headline at
 * `clamp(2.5rem, 6vw, 5rem)` inside a band with 80 px of padding leaves no room for the sentence under it.
 */
export const ctaHeadingStyles = cva(
  'mt-4 mb-0 max-w-[26ch] text-balance font-semibold text-display-2 first:mt-0',
  {
    variants: {
      onAccent: {
        true: 'text-foreground-onAccent',
        false: 'text-foreground',
      },
    },
  },
)

export const ctaDescriptionStyles = cva('mt-5 mb-0 max-w-xl text-pretty text-lg', {
  variants: {
    onAccent: {
      true: 'text-foreground-onAccent/85',
      false: 'text-foreground-muted',
    },
  },
})

export const CTA_ACTIONS = 'mt-8'
