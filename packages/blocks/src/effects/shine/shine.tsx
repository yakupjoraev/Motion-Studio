import { effectVars } from '../effect-vars'
import { EFFECT_LAYER_CLASS } from '../shared'

import type { ShineProps } from './shine.types'

/**
 * Shine.
 *
 * Technique: one tilted highlight crossing the surface and then waiting. The travel occupies the
 * first fifth of the cycle and the remaining four fifths are stillness — a highlight that never
 * stops is a loading skeleton, and the pause is what turns the same gradient into a material
 * catching the light. Only `transform` animates; the tilt rides in the same transform as the travel
 * so the two never fight.
 *
 * Built from technique, not from source: no reference implementation was adapted (ADR-144).
 */
export function Shine({ tint, intensity, speed, width, angle }: ShineProps) {
  return (
    <div
      aria-hidden
      className={`ms-fx ${EFFECT_LAYER_CLASS}`}
      data-testid="shine"
      style={effectVars({ tint, intensity, speed, angle })}
    >
      <span className="ms-fx-shine" data-testid="shine-band" style={{ width: `${width}%` }} />
    </div>
  )
}
