import { type MarkupElement, children, el, txt } from '@motion-studio/schema'

import { heroActionMarkup } from './hero-action.markup'
import { heroEyebrowMarkup } from './hero-eyebrow.markup'
import { heroTrustRowMarkup } from './hero-trust-row.markup'
import {
  heroActionsStyles,
  heroCopyStyles,
  heroHeadlineStyles,
  heroSubtitleStyles,
} from './hero.styles'
import type { HeroCopyProps } from './hero.types'

/**
 * `HeroCopy` as markup — the column all six heroes share, so a hero's own producer states its frame
 * and nothing about its copy. What differs between `hero-split` and `hero-centered` is the frame, and
 * the parity test proves that for both.
 */
export function heroCopyMarkup({
  eyebrow,
  eyebrowStyle,
  headline,
  subtitle,
  actions,
  trust = [],
  align,
  subtitleSize = 'lg',
  headlineSize = 'display-1',
}: HeroCopyProps): MarkupElement {
  return el('div', {
    classNames: [heroCopyStyles({ align })],
    children: children(
      heroEyebrowMarkup({ text: eyebrow, eyebrowStyle }),
      el('h1', { classNames: [heroHeadlineStyles({ headlineSize })], children: [txt(headline)] }),
      subtitle !== '' &&
        el('p', {
          classNames: [heroSubtitleStyles({ size: subtitleSize })],
          children: [txt(subtitle)],
        }),
      actions.length > 0 &&
        el('div', {
          classNames: [heroActionsStyles({ align })],
          children: actions.map(heroActionMarkup),
        }),
      heroTrustRowMarkup({ items: trust, align }),
    ),
  })
}
