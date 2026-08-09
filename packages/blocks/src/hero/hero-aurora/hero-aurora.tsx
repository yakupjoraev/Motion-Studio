import { HeroCopy } from '../hero-copy'
import { heroInnerStyles, heroSectionStyles } from '../hero.styles'

import { AuroraBackdrop } from './aurora-backdrop'
import type { HeroAuroraProps } from './hero-aurora.types'

/**
 * Aurora hero.
 *
 * Technique: three blurred radial fields on separate layers, each anchored off a different corner and
 * drifting on its own period — 34, 47 and 61 multiples of the slowest duration token, deliberately
 * not multiples of one another, so the interference pattern between them never visibly repeats. A
 * scrim in the surface token sits over the fields to hold text contrast, and a noise overlay at
 * `mix-blend-mode: overlay` hides the banding an 8-bit gradient shows across a field this large.
 *
 * Pure CSS, in `packages/blocks/src/styles/blocks.css`: no WebGL, no canvas, no per-frame JavaScript.
 * That is what lets it export as itself. The drift stops under reduced motion — the media query
 * switches the animation off and the zeroed duration token covers the studio's own override — and the
 * composition it stops in is the one the block is designed around, not an arbitrary frame.
 *
 * **The LCP element is the headline**, measured at 304 ms on an aurora-only page under mobile
 * emulation (ADR-120).
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

      <AuroraBackdrop drift={drift} intensity={intensity} noise={noise} palette={palette} />
    </section>
  )
}
