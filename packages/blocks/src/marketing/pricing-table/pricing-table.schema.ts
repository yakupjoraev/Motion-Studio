import { z } from 'zod'

import {
  BODY_MAX_LENGTH,
  HREF_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  sectionCopyFields,
  sectionFrameFields,
} from '../marketing.schema'

export const PRICING_LAYOUTS = ['cards', 'table', 'compact'] as const

export type PricingLayout = (typeof PRICING_LAYOUTS)[number]

export const INTERVALS = ['month', 'year'] as const

export type Interval = (typeof INTERVALS)[number]

export const MAX_PLANS = 4
export const MAX_PLAN_FEATURES = 8
export const PRICE_MAX_LENGTH = 16

/**
 * `included` is a boolean and not an absence, because the two say different things: a feature listed as
 * excluded tells a reader this plan is the one *without* it, and a feature simply missing from a list
 * tells them nothing. The matrix layout needs the excluded rows to line up, which is the whole point of
 * a feature matrix.
 */
export const planFeatureSchema = z.object({
  label: z.string().max(BODY_MAX_LENGTH).default('What this plan includes'),
  included: z.boolean().default(true),
})

export type PlanFeature = z.infer<typeof planFeatureSchema>

/**
 * A price is a **string**, not a number. `49`, `Free`, `Custom` and `2,400` are all prices a real page
 * shows, and a numeric field would force three of them to be lies. The currency is separate so a
 * document can move it without editing four plans.
 */
export const planSchema = z.object({
  name: z.string().max(TITLE_MAX_LENGTH).default('Plan'),
  description: z.string().max(BODY_MAX_LENGTH).default(''),
  priceMonthly: z.string().max(PRICE_MAX_LENGTH).default('19'),
  priceYearly: z.string().max(PRICE_MAX_LENGTH).default('190'),
  /** Empty draws no badge. Non-empty is the "Most popular" plate on the highlighted plan. */
  badge: z.string().max(LABEL_MAX_LENGTH).default(''),
  ctaLabel: z.string().max(LABEL_MAX_LENGTH).default('Get started'),
  ctaHref: z.string().max(HREF_MAX_LENGTH).default('#'),
  features: z.array(planFeatureSchema).max(MAX_PLAN_FEATURES).default([]),
})

export type Plan = z.infer<typeof planSchema>

const DEFAULT_PLANS: readonly Plan[] = [
  {
    name: 'Free',
    description: 'Everything you need to try it properly.',
    priceMonthly: '0',
    priceYearly: '0',
    badge: '',
    ctaLabel: 'Start free',
    ctaHref: '#',
    features: [
      { label: 'Three documents', included: true },
      { label: 'The full block registry', included: true },
      { label: 'React and HTML export', included: true },
      { label: 'Custom themes', included: false },
      { label: 'Team libraries', included: false },
    ],
  },
  {
    name: 'Studio',
    description: 'For the work that ships.',
    priceMonthly: '19',
    priceYearly: '190',
    badge: 'Most popular',
    ctaLabel: 'Get Studio',
    ctaHref: '#',
    features: [
      { label: 'Unlimited documents', included: true },
      { label: 'The full block registry', included: true },
      { label: 'Every export target', included: true },
      { label: 'Custom themes', included: true },
      { label: 'Team libraries', included: false },
    ],
  },
  {
    name: 'Team',
    description: 'Shared libraries and review.',
    priceMonthly: '49',
    priceYearly: '490',
    badge: '',
    ctaLabel: 'Talk to us',
    ctaHref: '#',
    features: [
      { label: 'Unlimited documents', included: true },
      { label: 'The full block registry', included: true },
      { label: 'Every export target', included: true },
      { label: 'Custom themes', included: true },
      { label: 'Team libraries', included: true },
    ],
  },
]

export const pricingTableSchema = z.object({
  ...sectionCopyFields({
    eyebrow: 'Pricing',
    heading: 'One price, every block',
    description: 'Yearly is two months off. Change plans or leave whenever you like.',
  }),
  layout: z.enum(PRICING_LAYOUTS).default('cards'),
  /** `-1` highlights nothing, which is a real answer and not a missing one. */
  highlightIndex: z
    .number()
    .int()
    .min(-1)
    .max(MAX_PLANS - 1)
    .default(1),
  currency: z.string().max(3).default('$'),
  interval: z.enum(INTERVALS).default('month'),
  showToggle: z.boolean().default(true),
  glass: z.boolean().default(false),
  plans: z
    .array(planSchema)
    .min(1)
    .max(MAX_PLANS)
    .default([...DEFAULT_PLANS]),
  ...sectionFrameFields(),
})

export type PricingTableProps = z.infer<typeof pricingTableSchema>

export const planPrice = (plan: Plan, interval: Interval): string =>
  interval === 'month' ? plan.priceMonthly : plan.priceYearly

/** A price that is not a number takes no `/month` suffix: "Custom /month" is not a thing. */
export const priceIsNumeric = (price: string): boolean => /^[\d.,]+$/.test(price)

/**
 * The union of every plan's feature labels, in the order they first appear — the rows of the matrix.
 * Built here rather than in the component because it is the one piece of arithmetic in the block, and
 * the matrix is wrong in a way nobody notices if two plans name the same feature differently.
 */
export function featureMatrixRows(plans: readonly Plan[]): readonly string[] {
  const rows: string[] = []

  for (const plan of plans) {
    for (const feature of plan.features) {
      if (!rows.includes(feature.label)) {
        rows.push(feature.label)
      }
    }
  }

  return rows
}

/** Whether a plan includes a row of the matrix: `undefined` means the plan never mentioned it. */
export function planIncludes(plan: Plan, label: string): boolean | undefined {
  return plan.features.find((feature) => feature.label === label)?.included
}
