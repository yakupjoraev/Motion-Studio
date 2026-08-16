import { effectVars } from '../effect-vars'
import { EFFECT_LAYER_CLASS, tintVar } from '../shared'

import { auroraFieldStyles, auroraGrainStyles } from './aurora-background.styles'
import type { AuroraBackgroundProps } from './aurora-background.types'

/**
 * Aurora background.
 *
 * Technique: three blurred radial fields on separate layers, each drifting on its own period — 3, 4
 * and 5 multiples of the shared cycle, which share no common factor small enough for the
 * interference pattern to visibly repeat. Two hues rather than one, because a single hue blurred
 * this far reads as a glow; the overlap between them is what makes it an aurora. A noise layer at
 * `mix-blend-mode: overlay` hides the banding a wide gradient shows on an 8-bit display, and a scrim
 * of the surface colour goes over the lot so text in front of it stays legible — the requirement
 * most implementations of this treatment skip.
 *
 * Built from technique, not from source: no reference implementation was adapted (ADR-144).
 * Implemented against our schema, tokens and reduced-motion policy — see docs/DESIGN_REFERENCES.md.
 */
export function AuroraBackground({
  tint,
  secondaryTint,
  intensity,
  speed,
  blur,
  grain,
  scrim,
}: AuroraBackgroundProps) {
  return (
    <div
      aria-hidden
      className={`ms-fx ${EFFECT_LAYER_CLASS}`}
      data-testid="aurora-background"
      style={effectVars({ tint, intensity, speed, blur })}
    >
      <span className={auroraFieldStyles({ field: 'a' })} style={{ background: tintVar(tint) }} />
      <span
        className={auroraFieldStyles({ field: 'b' })}
        style={{ background: tintVar(secondaryTint) }}
      />
      <span className={auroraFieldStyles({ field: 'c' })} style={{ background: tintVar(tint) }} />
      {grain ? <span className={auroraGrainStyles} data-testid="aurora-grain" /> : null}
      {scrim ? <span className="ms-fx-scrim" data-testid="aurora-scrim" /> : null}
    </div>
  )
}
