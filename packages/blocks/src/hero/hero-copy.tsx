import { HeroAction } from './hero-action'
import { HeroEyebrow } from './hero-eyebrow'
import { HeroTrustRow } from './hero-trust-row'
import {
  heroActionsStyles,
  heroCopyStyles,
  heroHeadlineStyles,
  heroSubtitleStyles,
} from './hero.styles'
import type { HeroCopyProps } from './hero.types'

/**
 * The copy half of every hero: eyebrow, the one `<h1>`, subtitle, CTA pair, optional trust row.
 *
 * **The LCP element is this `<h1>`** in every hero that has no user-supplied image — PERFORMANCE.md
 * § Images calls that the single decision worth more than every other optimisation on a landing page.
 * ADR-120 carries the measurement and the one exception.
 *
 * Everything here is a named child, so what this file states is the *rhythm* — 24 / 24 / 40 px — and
 * nothing else. Each piece decides on its own whether it has anything to render.
 */
export function HeroCopy({
  eyebrow,
  eyebrowStyle,
  headline,
  subtitle,
  actions,
  trust = [],
  align,
  subtitleSize = 'lg',
  headlineSize = 'display-1',
}: HeroCopyProps) {
  return (
    <div className={heroCopyStyles({ align })}>
      <HeroEyebrow eyebrowStyle={eyebrowStyle} text={eyebrow} />

      <h1 className={heroHeadlineStyles({ headlineSize })}>{headline}</h1>

      {subtitle !== '' && <p className={heroSubtitleStyles({ size: subtitleSize })}>{subtitle}</p>}

      {actions.length > 0 && (
        <div className={heroActionsStyles({ align })}>
          {actions.map((action) => (
            <HeroAction action={action} key={action.label} />
          ))}
        </div>
      )}

      <HeroTrustRow align={align} items={trust} />
    </div>
  )
}
