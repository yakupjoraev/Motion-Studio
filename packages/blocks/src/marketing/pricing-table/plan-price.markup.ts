import { type MarkupElement, children, el, txt } from '@motion-studio/schema'

import {
  INTERVAL_SUFFIX,
  type Interval,
  type Plan,
  planPrice,
  priceIsNumeric,
} from './pricing-table.schema'
import { PLAN_CURRENCY, PLAN_INTERVAL, PLAN_PRICE, PLAN_PRICE_ROW } from './pricing-table.styles'

/** The currency sign and the interval suffix belong to a number; "Custom" gets neither. */
export const priceMarkup = (plan: Plan, currency: string, interval: Interval): MarkupElement => {
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
