import { effectVars } from '../effect-vars'
import { EFFECT_LAYER_CLASS } from '../shared'

import { particleField, particleStyle } from './particle-field'
import type { ParticlesProps } from './particles.types'

/**
 * Particles.
 *
 * Technique: points rising on their own periods, each one an element with a `transform` animation so
 * the whole field composites rather than repaints. The placement comes from a hash of the seed and
 * the index rather than from `Math.random`, which is what lets the same document render the same
 * field twice — required by the thumbnail generator and by anyone diffing an export.
 *
 * A canvas would be cheaper per particle and is the wrong trade here: the effect has to survive
 * export as readable source, and a canvas leaves the user a script instead of markup. The cost class
 * is `heavy` and the component is loaded on demand, which is where that trade is paid for.
 *
 * Built from technique, not from source: no reference implementation was adapted (ADR-144).
 */
export function Particles({ tint, intensity, speed, count, size, seed }: ParticlesProps) {
  const particles = particleField(count, size, seed)

  return (
    <div
      aria-hidden
      className={`ms-fx ${EFFECT_LAYER_CLASS}`}
      data-testid="particles"
      style={effectVars({ tint, intensity, speed })}
    >
      {particles.map((particle, index) => (
        <span
          className="ms-fx-particle"
          data-testid="particle"
          // biome-ignore lint/suspicious/noArrayIndexKey: the field is generated from (seed, index), so the index is the particle's identity
          key={index}
          style={particleStyle(particle, speed)}
        />
      ))}
    </div>
  )
}
