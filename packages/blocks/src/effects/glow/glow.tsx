import type { CSSProperties } from 'react'

import { effectVars } from '../effect-vars'
import { EFFECT_LAYER_CLASS } from '../shared'

import { GLOW_ORIGIN_VALUE } from './glow.styles'
import type { GlowProps } from './glow.types'

/**
 * Glow.
 *
 * Technique: one elliptical field bloomed from an edge or the centre, where the blur does the work
 * and the gradient only decides where the light starts. The layer stays the size of the box and
 * moves its *origin* rather than itself, which is what keeps the opposite corner lit instead of
 * going black. Breathing animates opacity and scale together — two compositor properties — and is
 * off by default because a section that pulses is a section that will not be looked away from.
 *
 * Built from technique, not from source: no reference implementation was adapted (ADR-144).
 */
export function Glow({ tint, intensity, blur, origin, breathe, speed }: GlowProps) {
  const style = {
    ...effectVars({ tint, intensity, speed, blur }),
    '--ms-fx-origin': GLOW_ORIGIN_VALUE[origin],
  } as CSSProperties

  return (
    <div aria-hidden className={`ms-fx ${EFFECT_LAYER_CLASS}`} data-testid="glow" style={style}>
      <span
        className={`absolute ms-fx-glow inset-[-25%]${breathe ? ' ms-fx-breathe' : ''}`}
        data-testid="glow-field"
      />
    </div>
  )
}
