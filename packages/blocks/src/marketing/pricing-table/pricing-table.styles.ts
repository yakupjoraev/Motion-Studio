import { cva } from 'class-variance-authority'

import { MARKETING_FOCUS, MARKETING_TRANSITION } from '../marketing.styles'
import { innerRadiusClass } from '../nested-radius'

/**
 * Three layouts. `cards` and `compact` are the same grid at different densities; `table` is a real
 * `<table>` and lays itself out.
 *
 * At 360 px the cards stack **and the highlighted one comes first** — `order-first` up to `sm`, where the
 * grid takes over. A user who highlighted a plan wants that plan seen first on the device where only one
 * card fits on screen at a time.
 */
export const pricingGridStyles = cva('grid items-start gap-6', {
  variants: {
    columns: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 @min-[640px]/frame:grid-cols-2',
      3: 'grid-cols-1 @min-[640px]/frame:grid-cols-2 @min-[1024px]/frame:grid-cols-3',
      4: 'grid-cols-1 @min-[640px]/frame:grid-cols-2 @min-[1024px]/frame:grid-cols-4',
    },
    layout: {
      cards: '',
      compact: 'gap-4',
      table: '',
    },
  },
})

/**
 * The plan card. Everything that changes with `highlighted` is paint — border, ring, shadow — and
 * nothing is geometry, which is what makes the highlight cost its neighbours no height. The badge is
 * absolutely positioned for the same reason: in the flow it would make the highlighted card taller, and
 * a grid row stretches every card to the tallest one.
 */
export const planCardStyles = cva(
  ['relative flex h-full flex-col rounded-xl p-6', MARKETING_TRANSITION].join(' '),
  {
    variants: {
      surface: {
        card: 'border border-border bg-surface-1 shadow-sm',
        glass: 'ms-glass shadow-md',
      },
      highlighted: {
        true: 'border-accent/60 bg-surface-2 shadow-lg ring-1 ring-accent/20 @max-[639px]/frame:order-first @min-[640px]/frame:order-none',
        false: '',
      },
      compact: { true: 'p-5', false: '' },
    },
    defaultVariants: { surface: 'card', highlighted: false, compact: false },
  },
)

/** Out of the flow, on the top edge, so it costs no height — see `planCardStyles`. */
export const PLAN_BADGE =
  'absolute top-0 left-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center rounded-full border border-accent/25 bg-accent px-3 py-1 font-medium text-2xs text-foreground-onAccent uppercase tracking-[0.1em]'

export const PLAN_NAME = 'm-0 font-semibold text-foreground text-lg'

export const PLAN_DESCRIPTION = 'mt-2 mb-0 text-foreground-muted text-base'

/**
 * The price. `tabular-nums` so 19 and 490 occupy the same width and the row does not jitter when the
 * interval changes, and `ms-price-swap` is the class that animates the change — one keyframe in
 * `blocks.css`, whose duration is a token, so reduced motion drops it to a straight swap.
 */
export const PLAN_PRICE_ROW = 'mt-6 flex items-baseline gap-1.5'

export const PLAN_PRICE = 'ms-price-swap m-0 font-semibold text-4xl text-foreground tabular-nums'

/**
 * The currency rides at the top of the figure, not on its baseline. Measured at 1440: `$` at 22 px on the
 * baseline of a 48 px number reads as a symbol stuck to the price; lifted to the cap height and stepped up
 * to `2xl` it reads as part of the amount, which is how every priced product sets it.
 */
export const PLAN_CURRENCY = 'self-start pt-1 font-medium text-2xl text-foreground-muted'

export const PLAN_INTERVAL = 'text-foreground-subtle text-base'

export const PLAN_FEATURES = 'mt-6 mb-0 flex list-none flex-col gap-3 p-0 text-base'

export const planFeatureStyles = cva('flex items-start gap-2.5', {
  variants: {
    included: {
      true: 'text-foreground',
      // Dimmed *and* marked with a dash, and the row says "not included" off screen. Colour alone is
      // never the signal — ACCESSIBILITY.md § Colour.
      false: 'text-foreground-subtle',
    },
  },
})

export const planFeatureMarkStyles = cva(
  'mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full',
  {
    variants: {
      included: {
        true: 'bg-success-muted text-success',
        false: 'bg-surface-2 text-foreground-subtle',
      },
    },
  },
)

export const planCtaStyles = cva(
  [
    'inline-flex h-11 w-full items-center justify-center gap-2 rounded-md px-5 font-medium text-md no-underline',
    MARKETING_TRANSITION,
    MARKETING_FOCUS,
  ].join(' '),
  {
    variants: {
      highlighted: {
        true: 'bg-accent text-foreground-onAccent shadow-md hover:bg-accent-hover',
        false:
          'border border-border-strong bg-surface-2 text-foreground shadow-xs hover:bg-surface-3',
      },
    },
  },
)

/**
 * The CTA sits on the bottom edge of every card whatever the feature lists above it do. `mt-auto` on the
 * row rather than on the button: the button is a flex item, and an auto margin on it would centre it in
 * the row instead of pushing the row down.
 */
export const PLAN_CTA_ROW = 'mt-auto flex pt-8'

/**
 * The interval toggle: two buttons on an inset plate. The plate is `lg` (12 px) and holds them 4 px in,
 * so the button's corner is `innerRadius(12, 4)` — the nested-radius rule spent through the helper
 * rather than eyeballed, which is what prompt 38 asks of every control that sits inside a surface.
 */
const TOGGLE_PLATE_RADIUS = 'lg' as const
const TOGGLE_PLATE_PADDING_PX = 4

export const INTERVAL_TOGGLE_PLATE =
  'mx-auto mb-10 inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2 p-1'

export const intervalButtonStyles = cva(
  [
    'inline-flex h-8 items-center px-3 font-medium text-sm',
    innerRadiusClass(TOGGLE_PLATE_RADIUS, TOGGLE_PLATE_PADDING_PX),
    MARKETING_TRANSITION,
    MARKETING_FOCUS,
  ].join(' '),
  {
    variants: {
      active: {
        true: 'bg-surface-0 text-foreground shadow-xs',
        false: 'text-foreground-muted hover:text-foreground',
      },
    },
  },
)

/** The matrix. `table-fixed` so the plan columns are equal and the feature column takes what is left. */
export const PRICING_MATRIX_SCROLLER = 'w-full overflow-x-auto'

export const PRICING_MATRIX = 'w-full min-w-[36rem] table-fixed border-collapse text-left text-base'

export const PRICING_MATRIX_HEAD = 'border-border border-b'

export const PRICING_MATRIX_TH = 'px-4 py-4 align-bottom font-semibold text-foreground'

export const PRICING_MATRIX_ROW = 'border-border-subtle border-b'

export const PRICING_MATRIX_TD = 'px-4 py-3 text-foreground-muted'

export const PRICING_MATRIX_CELL = 'px-4 py-3 text-center'
