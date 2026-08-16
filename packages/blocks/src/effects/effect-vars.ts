import type { CSSProperties } from 'react'

import { type EffectTint, tintVar } from './shared'

/**
 * The dynamic half of every effect, kept apart from `shared.ts` for the reason ADR-107 gives: the
 * definitions reach `shared`, and one `react` import anywhere in that graph — even a type-only one —
 * would put React in the metadata half of the package. `registry.node.test.ts` walks the source
 * text, so a type import counts.
 *
 * Rule 3 in COMPONENT_LIBRARY.md § Rules allows an inline style for a genuinely dynamic value
 * carried by a custom property, and an effect is almost entirely that: the classes carry the
 * technique, the variables carry the tuning.
 */
export interface EffectVars {
  readonly tint?: EffectTint
  readonly intensity?: number
  readonly speed?: number
  readonly size?: number
  readonly blur?: number
  readonly angle?: number
}

export function effectVars({
  tint,
  intensity,
  speed,
  size,
  blur,
  angle,
}: EffectVars): CSSProperties {
  const style: Record<string, string> = {}

  if (tint !== undefined) {
    style['--ms-fx-tint'] = tintVar(tint)
  }

  if (intensity !== undefined) {
    style['--ms-fx-intensity'] = String(intensity)
  }

  if (speed !== undefined) {
    style['--ms-fx-speed'] = String(speed)
  }

  if (size !== undefined) {
    style['--ms-fx-size'] = `${size}px`
  }

  if (blur !== undefined) {
    style['--ms-fx-blur'] = `${blur}px`
  }

  if (angle !== undefined) {
    style['--ms-fx-angle'] = `${angle}deg`
  }

  return style as CSSProperties
}
