import { type MarkupElement, el, literal, txt } from '@motion-studio/schema'

import type { Cta } from './hero.schema'
import { heroActionStyles } from './hero.styles'

/**
 * `HeroAction` as markup. An `href` makes it a link and an empty one makes it a button, here for the
 * same reason as on the canvas: Enter and Space are different promises and the element is what states
 * which one the page is making.
 */
export function heroActionMarkup(action: Cta): MarkupElement {
  const className = heroActionStyles({ variant: action.variant })
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
