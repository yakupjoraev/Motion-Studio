import type { CSSProperties } from 'react'

import { effectVars } from '../effect-vars'
import { EFFECT_LAYER_CLASS } from '../shared'

import type { DotGridProps } from './dot-grid.types'

/**
 * Dot grid.
 *
 * Technique: one `radial-gradient` tiled by `background-size`, not a grid of elements. A single
 * painted layer costs the same at 24 px spacing as at 96 px, where an element per dot would be
 * thousands of nodes on a full-bleed section. The dot radius is a hard stop rather than a soft one,
 * so the lattice stays crisp at any zoom instead of turning to mush. A radial mask fades it towards
 * the edges — the difference between texture on a surface and a sheet of graph paper.
 *
 * Built from technique, not from source: no reference implementation was adapted (ADR-144).
 */
export function DotGrid({ tint, intensity, spacing, dotSize, fade }: DotGridProps) {
  const style = {
    ...effectVars({ tint, intensity, size: spacing }),
    '--ms-fx-dot': `${dotSize}px`,
  } as CSSProperties

  return (
    <div aria-hidden className={`ms-fx ${EFFECT_LAYER_CLASS}`} data-testid="dot-grid" style={style}>
      <span className={`absolute ms-fx-dots inset-0${fade ? ' ms-fx-fade' : ''}`} />
    </div>
  )
}
