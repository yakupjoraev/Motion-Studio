import { effectVars } from '../effect-vars'
import { EFFECT_LAYER_CLASS } from '../shared'

import { noiseLayerStyles } from './noise-overlay.styles'
import type { NoiseOverlayProps } from './noise-overlay.types'

/**
 * Noise overlay.
 *
 * Technique: one tiled fractal-noise texture — the `--ms-noise-texture` token, an inline SVG
 * `feTurbulence`, so it costs no request — composited with a blend mode rather than laid on top at
 * low opacity. The blend is what makes it read as surface grain instead of grey fog: `overlay` and
 * `soft-light` keep the underlying value and disturb only the local contrast, which is why the same
 * layer works on a light and a dark surface without changing its opacity.
 *
 * Built from technique, not from source: no reference implementation was adapted (ADR-144).
 */
export function NoiseOverlay({ intensity, scale, blend }: NoiseOverlayProps) {
  return (
    <div
      aria-hidden
      className={`ms-fx ${EFFECT_LAYER_CLASS}`}
      data-testid="noise-overlay"
      style={effectVars({ intensity })}
    >
      <span
        className={noiseLayerStyles({ blend })}
        style={{ backgroundSize: `${scale}px ${scale}px` }}
      />
    </div>
  )
}
