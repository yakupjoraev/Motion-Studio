import { type MarkupElement, el, literal, txt } from '@motion-studio/schema'

import type { Action } from '../marketing/marketing.schema'

import { navActionStyles } from './navigation.styles'

/** `NavAction` as markup — a marketing action at chrome geometry, with the same element rule. */
export function navActionMarkup(action: Action): MarkupElement {
  const className = navActionStyles({ variant: action.variant })
  const label = [txt(action.label)]

  if (action.href === '') {
    return el('button', {
      classNames: [className],
      attributes: { type: literal('button') },
      children: label,
    })
  }

  return el('a', {
    classNames: [className],
    attributes: { href: literal(action.href) },
    children: label,
  })
}
