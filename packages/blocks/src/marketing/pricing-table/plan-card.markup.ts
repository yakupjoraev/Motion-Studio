import { type MarkupElement, children, el, literal, txt } from '@motion-studio/schema'

import type { HeadingLevel } from '../marketing.schema'
import { sectionHeadingMarkup } from '../section-heading.markup'

import { featureMarkMarkup } from './plan-feature-mark.markup'
import { priceMarkup } from './plan-price.markup'
import type { Interval, Plan } from './pricing-table.schema'
import {
  PLAN_BADGE,
  PLAN_CTA_ROW,
  PLAN_DESCRIPTION,
  PLAN_FEATURES,
  PLAN_NAME,
  planCardStyles,
  planCtaStyles,
  planFeatureStyles,
} from './pricing-table.styles'

/** One plan, in the order a reader scans it: badge, name, price, what it includes, the action. */
export const planCardMarkup = (
  plan: Plan,
  highlighted: boolean,
  currency: string,
  interval: Interval,
  glass: boolean,
  compact: boolean,
  headingLevel: HeadingLevel,
): MarkupElement =>
  el('article', {
    classNames: [planCardStyles({ surface: glass ? 'glass' : 'card', highlighted, compact })],
    attributes: { 'data-highlighted': literal(highlighted) },
    children: children(
      highlighted &&
        plan.badge !== '' &&
        el('span', { classNames: [PLAN_BADGE], children: [txt(plan.badge)] }),
      sectionHeadingMarkup({
        className: PLAN_NAME,
        level: headingLevel,
        children: [txt(plan.name)],
      }),
      plan.description !== '' &&
        el('p', { classNames: [PLAN_DESCRIPTION], children: [txt(plan.description)] }),
      priceMarkup(plan, currency, interval),
      !compact && plan.features.length > 0 && featureListMarkup(plan),
      el('div', {
        classNames: [PLAN_CTA_ROW],
        children: [
          el('a', {
            classNames: [planCtaStyles({ highlighted })],
            attributes: {
              'aria-label': literal(`${plan.ctaLabel} — ${plan.name}`),
              href: literal(plan.ctaHref),
            },
            children: [txt(plan.ctaLabel)],
          }),
        ],
      }),
    ),
  })

const featureListMarkup = (plan: Plan): MarkupElement =>
  el('ul', {
    classNames: [PLAN_FEATURES],
    children: plan.features.map((feature) =>
      el('li', {
        classNames: [planFeatureStyles({ included: feature.included })],
        children: [
          featureMarkMarkup(feature.included),
          el('span', {
            children: children(
              txt(feature.label),
              // The word an icon cannot carry, off screen.
              !feature.included &&
                el('span', {
                  classNames: ['sr-only'],
                  children: [txt(' — not included')],
                }),
            ),
          }),
        ],
      }),
    ),
  })
