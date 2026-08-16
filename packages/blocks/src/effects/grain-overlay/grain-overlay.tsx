import { effectVars } from '../effect-vars'
import { EFFECT_LAYER_CLASS } from '../shared'

import { grainLayerStyles } from './grain-overlay.styles'
import type { GrainOverlayProps } from './grain-overlay.types'

/**
 * Grain overlay — film grain, the moving sibling of the static noise layer.
 *
 * Technique: the same noise texture, translated through eight discrete offsets with `steps(8, end)`
 * rather than tweened. Film grain resamples between frames; anything smooth reads as a texture
 * sliding across the shot, which is the tell. The layer is inset by −10 % so an offset never exposes
 * an edge, and the eight steps span four cycles — at the schema's fastest speed that is 2.5 Hz, under
 * the 3 Hz limit in ACCESSIBILITY.md with the cap coming from the schema rather than from a comment.
 *
 * Built from technique, not from source: no reference implementation was adapted (ADR-144).
 */
export function GrainOverlay({ intensity, scale, speed, blend }: GrainOverlayProps) {
  return (
    <div
      aria-hidden
      className={`ms-fx ${EFFECT_LAYER_CLASS}`}
      data-testid="grain-overlay"
      style={effectVars({ intensity, speed })}
    >
      <span
        className={grainLayerStyles({ blend })}
        style={{ backgroundSize: `${scale}px ${scale}px` }}
      />
    </div>
  )
}
