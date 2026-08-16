import type { CSSProperties } from 'react'

import { effectVars } from '../effect-vars'
import { EFFECT_LAYER_CLASS } from '../shared'

import type { ScanlinesProps } from './scanlines.types'

/**
 * Scanlines.
 *
 * Technique: one `repeating-linear-gradient` whose period is a length rather than a count, so the
 * lines stay the same distance apart at any node height. The drift moves `background-position` by
 * exactly one period, which makes the loop seamless — a fractional offset is where a scanline effect
 * visibly stutters at the wrap. Drift is its own class and off by default: a fine repeating pattern
 * in motion is the one thing in this category most likely to bother someone, and the still version
 * is the design rather than a fallback.
 *
 * Built from technique, not from source: no reference implementation was adapted (ADR-144).
 */
export function Scanlines({ tint, intensity, speed, spacing, lineWidth, drift }: ScanlinesProps) {
  const style = {
    ...effectVars({ tint, intensity, speed, size: spacing }),
    '--ms-fx-line': `${lineWidth}px`,
  } as CSSProperties

  return (
    <div
      aria-hidden
      className={`ms-fx ${EFFECT_LAYER_CLASS}`}
      data-testid="scanlines"
      style={style}
    >
      <span
        className={`absolute ms-fx-scanlines inset-0${drift ? ' ms-fx-scanlines-drift' : ''}`}
        data-testid="scanline-layer"
      />
    </div>
  )
}
