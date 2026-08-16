import type { CSSProperties } from 'react'

import { effectVars } from '../effect-vars'
import { EFFECT_LAYER_CLASS } from '../shared'

import { gridLinesStyles } from './grid-lines.styles'
import type { GridLinesProps } from './grid-lines.types'

/**
 * Grid lines.
 *
 * Technique: two stacked `linear-gradient`s — one per axis — tiled by `background-size`, so a full
 * lattice is one painted layer with no elements in it. The hard colour stop at the line width is
 * what keeps the rule exactly one device pixel wide instead of a two-pixel blur, and the same radial
 * mask the dot grid uses fades it out before it reaches an edge, where a straight cut would read as
 * a mistake.
 *
 * Built from technique, not from source: no reference implementation was adapted (ADR-144).
 */
export function GridLines({ tint, intensity, spacing, lineWidth, axis, fade }: GridLinesProps) {
  const style = {
    ...effectVars({ tint, intensity, size: spacing }),
    '--ms-fx-line': `${lineWidth}px`,
  } as CSSProperties

  return (
    <div
      aria-hidden
      className={`ms-fx ${EFFECT_LAYER_CLASS}`}
      data-testid="grid-lines"
      style={style}
    >
      <span className={gridLinesStyles({ axis, fade })} />
    </div>
  )
}
