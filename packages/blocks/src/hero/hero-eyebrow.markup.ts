import { type MarkupElement, children, el, literal, txt } from '@motion-studio/schema'

import type { EyebrowStyle } from './hero.schema'
import { HERO_EYEBROW_DOT, heroEyebrowStyles } from './hero.styles'

export interface HeroEyebrowMarkupInput {
  readonly text: string
  readonly eyebrowStyle: EyebrowStyle
}

/** `HeroEyebrow` as markup. Empty text is nothing at all, not an empty line of rhythm. */
export function heroEyebrowMarkup({
  text,
  eyebrowStyle,
}: HeroEyebrowMarkupInput): MarkupElement | null {
  if (text === '') {
    return null
  }

  return el('p', {
    classNames: [heroEyebrowStyles({ eyebrowStyle })],
    children: children(
      eyebrowStyle === 'pill' &&
        el('span', {
          classNames: [HERO_EYEBROW_DOT],
          attributes: { 'aria-hidden': literal(true) },
        }),
      txt(text),
    ),
  })
}
