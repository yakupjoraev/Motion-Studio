import { effectVars } from '../effect-vars'
import { EFFECT_LAYER_CLASS } from '../shared'

import { BEAM_OFFSET, beamStyle } from './beams.styles'
import type { BeamsProps } from './beams.types'

/**
 * Beams.
 *
 * Technique: bands of light travelling across the surface inside one rotated container, so the tilt
 * is a single transform rather than an angle baked into every gradient — change the angle and
 * nothing else has to be recomputed. Each band is a soft-edged vertical gradient, blurred a quarter
 * of the blur token, and starts at its own fraction of the shared cycle so the group drifts apart
 * instead of sweeping in formation. Only `transform` animates, so the whole effect stays on the
 * compositor.
 *
 * Built from technique, not from source: no reference implementation was adapted (ADR-144).
 */
export function Beams({ tint, intensity, speed, count, width, angle }: BeamsProps) {
  return (
    <div
      aria-hidden
      className={`ms-fx ${EFFECT_LAYER_CLASS}`}
      data-testid="beams"
      style={effectVars({ tint, intensity, speed, size: width, angle })}
    >
      <div className="absolute inset-0 ms-fx-beams">
        {Array.from({ length: count }, (_unused, index) => (
          <span
            className="ms-fx-beam"
            data-testid="beam"
            // biome-ignore lint/suspicious/noArrayIndexKey: the beams are positional and identical — nothing distinguishes one from another but where it sits
            key={index}
            style={beamStyle(index, count, BEAM_OFFSET)}
          />
        ))}
      </div>
    </div>
  )
}
