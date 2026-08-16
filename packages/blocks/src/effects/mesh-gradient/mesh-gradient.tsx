import { effectVars } from '../effect-vars'
import { EFFECT_LAYER_CLASS } from '../shared'

import { meshBackground } from './mesh-gradient.styles'
import type { MeshGradientProps } from './mesh-gradient.types'

/**
 * Mesh gradient.
 *
 * Technique: four tinted radial stops composed into a single `background-image` on one oversized
 * layer, then animated by `background-position` alone. Because the stops share a layer, the mix
 * where they overlap is a real colour blend rather than a stack of translucent sheets, and one
 * animated property carries all four. A light blur removes the ring artefacts a radial stop shows
 * at low spread; the cost class is `heavy` because a full-bleed animated background is the most
 * expensive thing in this category and the palette should say so.
 *
 * Built from technique, not from source: no reference implementation was adapted (ADR-144).
 */
export function MeshGradient({
  tint,
  secondaryTint,
  tertiaryTint,
  intensity,
  speed,
  blur,
  spread,
}: MeshGradientProps) {
  return (
    <div
      aria-hidden
      className={`ms-fx ${EFFECT_LAYER_CLASS}`}
      data-testid="mesh-gradient"
      style={effectVars({ intensity, speed, blur })}
    >
      <span
        className="absolute inset-[-20%] ms-fx-mesh"
        style={{ backgroundImage: meshBackground([tint, secondaryTint, tertiaryTint], spread) }}
      />
    </div>
  )
}
