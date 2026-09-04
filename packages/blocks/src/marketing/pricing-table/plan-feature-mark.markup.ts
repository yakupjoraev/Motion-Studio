import { type MarkupElement, children, el, literal } from '@motion-studio/schema'

import { iconMarkup } from '../../markup/icon'

import { planFeatureMarkStyles } from './pricing-table.styles'

/** A tick or a dash: the shape is the signal, not the colour. */
export const featureMarkMarkup = (included: boolean): MarkupElement =>
  el('span', {
    classNames: [planFeatureMarkStyles({ included })],
    attributes: { 'data-included': literal(included) },
    children: children(iconMarkup({ name: included ? 'check' : 'minus', size: 12 })),
  })
