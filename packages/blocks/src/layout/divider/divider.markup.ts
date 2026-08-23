import { defineMarkup, el, literal, ref, txt } from '@motion-studio/schema'

import {
  dividerLabelledStyles,
  dividerRuleStyles,
  dividerStyles,
  dividerTextStyles,
} from './divider.styles'
import type { DividerProps } from './divider.types'

/**
 * Two forms, and the semantics follow the form — the component's own rule: an unlabelled rule is an
 * `<hr>`, which is a separator by itself, and a labelled one is a `div` with `role="separator"`,
 * because an `<hr>` cannot hold text.
 */
export const dividerMarkup = defineMarkup<DividerProps>(({ props }) => {
  if (props.label === '') {
    return el('hr', { classNames: [dividerStyles(props)] })
  }

  const rule = () =>
    el('span', {
      classNames: [dividerRuleStyles(props)],
      attributes: { 'aria-hidden': literal(true) },
    })

  return el('div', {
    classNames: [dividerLabelledStyles(props)],
    attributes: {
      'aria-label': ref('label'),
      'aria-orientation': ref('orientation'),
      role: literal('separator'),
    },
    children: [
      rule(),
      el('span', { classNames: [dividerTextStyles()], children: [txt(props.label)] }),
      rule(),
    ],
  })
})
