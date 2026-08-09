import type { Alignment } from '../scales'

import type { TrustItem } from './hero.schema'
import { heroTrustStyles } from './hero.styles'

export interface HeroTrustRowProps {
  readonly items: readonly TrustItem[]
  readonly align: Alignment
}

/** Short proof under the buttons — a licence, a price, a count. Nothing at all when there is none. */
export function HeroTrustRow({ items, align }: HeroTrustRowProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <ul className={heroTrustStyles({ align })}>
      {items.map((item) => (
        <li key={item.label}>{item.label}</li>
      ))}
    </ul>
  )
}
