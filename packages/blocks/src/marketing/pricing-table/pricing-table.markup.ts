import { type MarkupElement, children, defineMarkup, el, literal, txt } from '@motion-studio/schema'
import { cn } from '@motion-studio/utils'

import { iconMarkup } from '../../markup/icon'
import { marketingSectionMarkup } from '../marketing-section.markup'
import { type HeadingLevel, nextHeadingLevel } from '../marketing.schema'
import { sectionHeadingMarkup } from '../section-heading.markup'

import {
  INTERVAL_OPTIONS,
  INTERVAL_SUFFIX,
  type Interval,
  type Plan,
  featureMatrixRows,
  planIncludes,
  planPrice,
  priceIsNumeric,
} from './pricing-table.schema'
import {
  INTERVAL_TOGGLE_PLATE,
  PLAN_BADGE,
  PLAN_CTA_ROW,
  PLAN_CURRENCY,
  PLAN_DESCRIPTION,
  PLAN_FEATURES,
  PLAN_INTERVAL,
  PLAN_NAME,
  PLAN_PRICE,
  PLAN_PRICE_ROW,
  PRICING_MATRIX,
  PRICING_MATRIX_CELL,
  PRICING_MATRIX_HEAD,
  PRICING_MATRIX_ROW,
  PRICING_MATRIX_SCROLLER,
  PRICING_MATRIX_TD,
  PRICING_MATRIX_TH,
  intervalButtonStyles,
  planCardStyles,
  planCtaStyles,
  planFeatureMarkStyles,
  planFeatureStyles,
  pricingGridStyles,
} from './pricing-table.styles'
import type { PricingTableProps } from './pricing-table.types'

/**
 * The toggle in the state the document stored. Which interval a reader then chooses is behaviour, and
 * behaviour is the component's — what the export carries is the control and the interval it opens on.
 */
const intervalToggleMarkup = (value: Interval): MarkupElement =>
  el('div', {
    classNames: [INTERVAL_TOGGLE_PLATE],
    attributes: { 'aria-label': literal('Billing interval'), role: literal('group') },
    children: INTERVAL_OPTIONS.map((option) =>
      el('button', {
        classNames: [intervalButtonStyles({ active: value === option.value })],
        attributes: {
          'aria-pressed': literal(value === option.value),
          type: literal('button'),
        },
        children: [txt(option.label)],
      }),
    ),
  })

/** A tick or a dash: the shape is the signal, not the colour. */
const featureMarkMarkup = (included: boolean): MarkupElement =>
  el('span', {
    classNames: [planFeatureMarkStyles({ included })],
    attributes: { 'data-included': literal(included) },
    children: children(iconMarkup({ name: included ? 'check' : 'minus', size: 12 })),
  })

const priceMarkup = (plan: Plan, currency: string, interval: Interval): MarkupElement => {
  const price = planPrice(plan, interval)
  const numeric = priceIsNumeric(price)

  return el('p', {
    classNames: [PLAN_PRICE_ROW],
    children: children(
      el('span', {
        classNames: [PLAN_PRICE],
        children: children(
          numeric &&
            currency !== '' &&
            el('span', { classNames: [PLAN_CURRENCY], children: [txt(currency)] }),
          txt(price),
        ),
      }),
      numeric &&
        el('span', { classNames: [PLAN_INTERVAL], children: [txt(INTERVAL_SUFFIX[interval])] }),
    ),
  })
}

const planCardMarkup = (
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
      !compact &&
        plan.features.length > 0 &&
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
        }),
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

const matrixMarkup = (
  plans: readonly Plan[],
  currency: string,
  interval: Interval,
  highlightIndex: number,
  caption: string,
): MarkupElement =>
  el('div', {
    classNames: [PRICING_MATRIX_SCROLLER],
    children: [
      el('table', {
        classNames: [PRICING_MATRIX],
        children: [
          el('caption', { classNames: ['sr-only'], children: [txt(caption)] }),
          el('thead', {
            classNames: [PRICING_MATRIX_HEAD],
            children: [
              el('tr', {
                children: [
                  el('th', {
                    classNames: [PRICING_MATRIX_TH],
                    attributes: { scope: literal('col') },
                    children: [el('span', { classNames: ['sr-only'], children: [txt('Feature')] })],
                  }),
                  ...plans.map((plan, index) => {
                    const price = planPrice(plan, interval)

                    return el('th', {
                      classNames: [cn(PRICING_MATRIX_TH, 'text-center')],
                      attributes: {
                        'data-highlighted': literal(index === highlightIndex),
                        scope: literal('col'),
                      },
                      children: [
                        el('span', {
                          ...(index === highlightIndex ? { classNames: ['text-accent'] } : {}),
                          children: [txt(plan.name)],
                        }),
                        el('span', {
                          classNames: [
                            'mt-1 block font-normal text-foreground-muted text-base tabular-nums',
                          ],
                          children: [txt(priceIsNumeric(price) ? `${currency}${price}` : price)],
                        }),
                      ],
                    })
                  }),
                ],
              }),
            ],
          }),
          el('tbody', {
            children: featureMatrixRows(plans).map((label) =>
              el('tr', {
                classNames: [PRICING_MATRIX_ROW],
                children: [
                  el('th', {
                    classNames: [cn(PRICING_MATRIX_TD, 'font-normal')],
                    attributes: { scope: literal('row') },
                    children: [txt(label)],
                  }),
                  ...plans.map((plan) =>
                    el('td', {
                      classNames: [PRICING_MATRIX_CELL],
                      children: [
                        el('span', {
                          classNames: ['inline-flex items-center justify-center'],
                          children: [
                            featureMarkMarkup(planIncludes(plan, label) === true),
                            el('span', {
                              classNames: ['sr-only'],
                              children: [
                                txt(
                                  planIncludes(plan, label) === true ? 'Included' : 'Not included',
                                ),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ),
                ],
              }),
            ),
          }),
        ],
      }),
    ],
  })

export const pricingTableMarkup = defineMarkup<PricingTableProps>(
  ({
    props: {
      eyebrow,
      heading,
      description,
      headingLevel,
      headingAlign,
      layout,
      highlightIndex,
      currency,
      interval,
      showToggle,
      glass,
      plans,
      hidden,
    },
  }) =>
    marketingSectionMarkup({
      copy: { eyebrow, heading, description, headingLevel, headingAlign },
      hidden,
      children: children(
        showToggle &&
          el('div', {
            classNames: ['flex w-full justify-center'],
            children: [intervalToggleMarkup(interval)],
          }),
        layout === 'table'
          ? matrixMarkup(
              plans,
              currency,
              interval,
              highlightIndex,
              heading === '' ? 'Plan comparison' : heading,
            )
          : el('div', {
              classNames: [
                pricingGridStyles({
                  columns: Math.min(plans.length, 4) as 1 | 2 | 3 | 4,
                  layout: layout === 'compact' ? 'compact' : 'cards',
                }),
              ],
              children: plans.map((plan, index) =>
                planCardMarkup(
                  plan,
                  index === highlightIndex,
                  currency,
                  interval,
                  glass,
                  layout === 'compact',
                  nextHeadingLevel(headingLevel),
                ),
              ),
            }),
      ),
    }),
)
