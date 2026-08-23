import { type MarkupElement, el, literal, txt } from '@motion-studio/schema'
import { cn } from '@motion-studio/utils'

import type { Action } from './marketing.schema'
import { actionOnAccentStyles, actionStyles } from './marketing.styles'

export interface ActionButtonMarkupInput {
  readonly action: Action
  readonly onAccent?: boolean
}

/**
 * `ActionButton` as markup. An action with an `href` is an `<a>` and one without is a `<button>` here
 * too: the element is the promise the keyboard makes, and an export that flattened both to one would
 * ship a page that behaves differently from the canvas it was drawn on.
 */
export function actionButtonMarkup({
  action,
  onAccent = false,
}: ActionButtonMarkupInput): MarkupElement {
  const className = cn(
    actionStyles({ variant: action.variant }),
    onAccent && actionOnAccentStyles({ variant: action.variant }),
  )
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
