import { HeroCopy } from '../hero-copy'
import { heroInnerStyles, heroSectionStyles } from '../hero.styles'

import {
  AURORA_DRIFTS,
  AURORA_FIELDS,
  AURORA_SCRIM,
  auroraFieldsStyles,
  auroraNoiseStyles,
} from './hero-aurora.styles'
import type { HeroAuroraProps } from './hero-aurora.types'

/**
 * Aurora hero.
 *
 * Technique: three blurred radial fields on separate layers, each anchored off a different corner and
 * drifting on its own period — 34, 47 and 61 multiples of the slowest duration token, deliberately
 * not multiples of one another, so the interference pattern between them never visibly repeats. A
 * scrim in the surface token sits over the fields to hold text contrast, and a noise overlay at
 * `mix-blend-mode: overlay` hides the banding that a browser's 8-bit gradient interpolation produces
 * across a field this large.
 *
 * Pure CSS, in `packages/blocks/src/styles/blocks.css`: no WebGL, no canvas, no per-frame JavaScript.
 * That is what lets it export as itself. The drift stops under reduced motion — the media query
 * switches the animation off and the zeroed duration token covers the studio's own override — and the
 * composition it stops in is the one the block is designed around, not an arbitrary frame.
 *
 * **The LCP element is the headline.** The whole backdrop is `aria-hidden`, has no content, and is
 * rendered after the copy in DOM order; it sits behind by z-index, not by being painted first.
 *
 * Design reference: impeccable.style — aurora treatment. Built from the technique rather than from
 * source; see docs/DESIGN_REFERENCES.md and packages/blocks/LICENSES.md.
 */
export function HeroAurora({
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
  palette,
  intensity,
  drift,
  noise,
}: HeroAuroraProps) {
  return (
    <section
      className={`${heroSectionStyles({ padding, minHeight, align, hidden })} justify-center overflow-hidden bg-surface-0`}
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

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        data-testid="hero-aurora-backdrop"
      >
        <div className={auroraFieldsStyles({ palette, intensity })}>
          {AURORA_FIELDS.map((field, index) => (
            <div
              className={drift ? `${field} ${AURORA_DRIFTS[index]}` : field}
              data-testid="aurora-field"
              key={field}
            />
          ))}
        </div>

        <div className={AURORA_SCRIM} />
        <div className={auroraNoiseStyles({ noise })} data-testid="aurora-noise" />
      </div>
    </section>
  )
}
