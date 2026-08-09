import {
  HERO_EYEBROW_DOT,
  heroActionStyles,
  heroActionsStyles,
  heroCopyStyles,
  heroEyebrowStyles,
  heroHeadlineStyles,
  heroSubtitleStyles,
  heroTrustStyles,
} from './hero.styles'
import type { HeroCopyProps } from './hero.types'

/**
 * The copy half of every hero: eyebrow, the one `<h1>`, subtitle, CTA pair, optional trust row.
 *
 * **The LCP element is this `<h1>`.** No hero puts an image, a video or an animated layer where it
 * could win that measurement — PERFORMANCE.md § Images calls it the single decision worth more than
 * every other optimisation on the landing page. Each block repeats the rule where it renders its own
 * decoration, because that is where somebody would break it.
 *
 * A CTA with an `href` is an `<a>` and one without is a `<button>`. That is not cosmetic: a link the
 * keyboard reaches with Enter and a button it reaches with Space are different promises.
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
      {eyebrow !== '' && (
        <p className={heroEyebrowStyles({ eyebrowStyle })}>
          {eyebrowStyle === 'pill' && <span aria-hidden="true" className={HERO_EYEBROW_DOT} />}
          {eyebrow}
        </p>
      )}

      <h1 className={heroHeadlineStyles({ headlineSize })}>{headline}</h1>

      {subtitle !== '' && <p className={heroSubtitleStyles({ size: subtitleSize })}>{subtitle}</p>}

      {actions.length > 0 && (
        <div className={heroActionsStyles({ align })}>
          {actions.map((action) =>
            action.href === '' ? (
              <button
                className={heroActionStyles({ variant: action.variant })}
                key={action.label}
                type="button"
              >
                {action.label}
              </button>
            ) : (
              <a
                className={heroActionStyles({ variant: action.variant })}
                href={action.href}
                key={action.label}
              >
                {action.label}
              </a>
            ),
          )}
        </div>
      )}

      {trust.length > 0 && (
        <ul className={heroTrustStyles({ align })}>
          {trust.map((item) => (
            <li key={item.label}>{item.label}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
