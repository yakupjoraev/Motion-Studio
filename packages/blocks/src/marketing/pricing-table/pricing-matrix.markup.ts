import { type MarkupElement, el, literal, txt } from '@motion-studio/schema'
import { cn } from '@motion-studio/utils'

import { featureMarkMarkup } from './plan-feature-mark.markup'
import {
  type Interval,
  type Plan,
  featureMatrixRows,
  planIncludes,
  planPrice,
  priceIsNumeric,
} from './pricing-table.schema'
import {
  PRICING_MATRIX,
  PRICING_MATRIX_CELL,
  PRICING_MATRIX_HEAD,
  PRICING_MATRIX_ROW,
  PRICING_MATRIX_SCROLLER,
  PRICING_MATRIX_TD,
  PRICING_MATRIX_TH,
} from './pricing-table.styles'

/**
 * The comparison layout: one column per plan, one row per feature any plan names. A real `<table>`
 * with `scope` on both axes, because a matrix read by a screen reader is a table or it is nothing.
 */
export const matrixMarkup = (
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
                  ...plans.map((plan, index) =>
                    planColumnMarkup(plan, index === highlightIndex, currency, interval),
                  ),
                ],
              }),
            ],
          }),
          el('tbody', {
            children: featureMatrixRows(plans).map((label) => featureRowMarkup(plans, label)),
          }),
        ],
      }),
    ],
  })

const planColumnMarkup = (
  plan: Plan,
  highlighted: boolean,
  currency: string,
  interval: Interval,
): MarkupElement => {
  const price = planPrice(plan, interval)

  return el('th', {
    classNames: [cn(PRICING_MATRIX_TH, 'text-center')],
    attributes: {
      'data-highlighted': literal(highlighted),
      scope: literal('col'),
    },
    children: [
      el('span', {
        ...(highlighted ? { classNames: ['text-accent'] } : {}),
        children: [txt(plan.name)],
      }),
      el('span', {
        classNames: ['mt-1 block font-normal text-foreground-muted text-base tabular-nums'],
        children: [txt(priceIsNumeric(price) ? `${currency}${price}` : price)],
      }),
    ],
  })
}

const featureRowMarkup = (plans: readonly Plan[], label: string): MarkupElement =>
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
                  children: [txt(planIncludes(plan, label) === true ? 'Included' : 'Not included')],
                }),
              ],
            }),
          ],
        }),
      ),
    ],
  })
