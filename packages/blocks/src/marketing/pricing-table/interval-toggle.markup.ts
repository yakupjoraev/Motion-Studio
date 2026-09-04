import { type MarkupElement, el, literal, txt } from '@motion-studio/schema'

import { INTERVAL_OPTIONS, type Interval } from './pricing-table.schema'
import { INTERVAL_TOGGLE_PLATE, intervalButtonStyles } from './pricing-table.styles'

/**
 * The toggle in the state the document stored. Which interval a reader then chooses is behaviour, and
 * behaviour is the component's — what the export carries is the control and the interval it opens on.
 */
export const intervalToggleMarkup = (value: Interval): MarkupElement =>
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
