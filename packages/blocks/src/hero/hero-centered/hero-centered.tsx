import { HeroCopy } from '../hero-copy'
import { heroInnerStyles, heroSectionStyles } from '../hero.styles'

import { HERO_CENTERED_GLOW, heroCenteredSurfaceStyles } from './hero-centered.styles'
import type { HeroCenteredProps } from './hero-centered.types'

/**
 * The centred stack: eyebrow, one `<h1>`, subtitle, CTA pair, trust row.
 *
 * **The LCP element is the headline.** The glow is a blurred gradient with no content, it is
 * `aria-hidden`, and it is rendered *after* the copy in DOM order so nothing paints ahead of the
 * text — PERFORMANCE.md § Images.
 *
 * Design reference: impeccable.style — the centred marketing hero. The technique taken from it is
 * not the colour: it is that a single wide accent field sits behind the headline and nothing else,
 * so the eye lands on the type and reads the light as depth rather than as decoration. Implemented
 * independently against our tokens and schema. See docs/DESIGN_REFERENCES.md.
 */
export function HeroCentered({
  eyebrow,
  eyebrowStyle,
  headline,
  subtitle,
  actions,
  trust,
  align,
  maxWidth,
  padding,
  minHeight,
  hidden,
  background,
  glow,
}: HeroCenteredProps) {
  return (
    <section
      className={`${heroSectionStyles({ padding, minHeight, align, hidden })} ${heroCenteredSurfaceStyles({ background })} justify-center`}
    >
      <div className={heroInnerStyles({ maxWidth, align })}>
        <HeroCopy
          actions={actions}
          align={align}
          eyebrow={eyebrow}
          eyebrowStyle={eyebrowStyle}
          headline={headline}
          subtitle={subtitle}
          trust={trust}
        />
      </div>

      {glow && <div aria-hidden="true" className={HERO_CENTERED_GLOW} data-testid="hero-glow" />}
    </section>
  )
}
