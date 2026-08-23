import { defineMarkup, el, literal } from '@motion-studio/schema'

import { effectVars } from '../effect-vars'
import { cssVarsOf } from '../effect-vars.markup'
import { EFFECT_LAYER_CLASS } from '../shared'

import { particleField, particleStyle } from './particle-field'
import type { ParticlesProps } from './particles.types'

export const particlesMarkup = defineMarkup<ParticlesProps>(
  ({ props: { tint, intensity, speed, count, size, seed } }) =>
    el('div', {
      classNames: ['ms-fx', EFFECT_LAYER_CLASS],
      attributes: { 'aria-hidden': literal(true) },
      cssVars: cssVarsOf(effectVars({ tint, intensity, speed })),
      // The field is generated from (seed, index), so the export draws the one the canvas drew.
      children: particleField(count, size, seed).map((particle) =>
        el('span', {
          classNames: ['ms-fx-particle'],
          cssVars: cssVarsOf(particleStyle(particle, speed)),
        }),
      ),
    }),
)
