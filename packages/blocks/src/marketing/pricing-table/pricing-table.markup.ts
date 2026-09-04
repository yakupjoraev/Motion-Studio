import { children, defineMarkup, el } from '@motion-studio/schema'

import { marketingSectionMarkup } from '../marketing-section.markup'
import { nextHeadingLevel } from '../marketing.schema'

import { intervalToggleMarkup } from './interval-toggle.markup'
import { planCardMarkup } from './plan-card.markup'
import { matrixMarkup } from './pricing-matrix.markup'
import { pricingGridStyles } from './pricing-table.styles'
import type { PricingTableProps } from './pricing-table.types'

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
