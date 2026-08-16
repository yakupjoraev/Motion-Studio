'use client'

import { type CSSProperties, useRef } from 'react'

import { effectVars } from '../effect-vars'
import { EFFECT_LAYER_CLASS } from '../shared'

import type { SpotlightProps } from './spotlight.types'
import { usePointerLight } from './use-pointer-light'

/**
 * Spotlight.
 *
 * Technique: one radial gradient whose centre is two custom properties, written from the shared
 * pointer bus. Because the position is a variable rather than a React value, the light follows the
 * cursor with no render at all — the same reason the cursor presets cost nothing. `background-image`
 * is repainted rather than composited, so the reach is capped well below the full box: a
 * viewport-sized soft gradient is the one shape that makes this technique expensive.
 *
 * Built from technique, not from source: no reference implementation was adapted (ADR-144).
 */
export function Spotlight({ tint, intensity, reach, followPointer }: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null)

  usePointerLight(ref, followPointer)

  const style = {
    ...effectVars({ tint, intensity }),
    '--ms-fx-reach': `${reach}%`,
  } as CSSProperties

  return (
    <div
      aria-hidden
      className={`ms-fx ms-fx-spotlight ${EFFECT_LAYER_CLASS}`}
      data-follows={followPointer}
      data-testid="spotlight"
      ref={ref}
      style={style}
    />
  )
}
