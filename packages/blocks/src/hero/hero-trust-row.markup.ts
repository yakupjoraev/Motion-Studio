import { type MarkupElement, el, txt } from '@motion-studio/schema'

import type { Alignment } from '../scales'

import type { TrustItem } from './hero.schema'
import { heroTrustStyles } from './hero.styles'

export interface HeroTrustRowMarkupInput {
  readonly items: readonly TrustItem[]
  readonly align: Alignment
}

/**
 * `HeroTrustRow` as markup. The list is iterated here and printed as elements — ADR-249 § 5: a
 * collection is baked rather than referenced, because a loop node is a feature every printer would
 * have to carry for a component nobody asked for.
 */
export function heroTrustRowMarkup({
  items,
  align,
}: HeroTrustRowMarkupInput): MarkupElement | null {
  if (items.length === 0) {
    return null
  }

  return el('ul', {
    classNames: [heroTrustStyles({ align })],
    children: items.map((item) => el('li', { children: [txt(item.label)] })),
  })
}
