import { defineMarkup, el, literal } from '@motion-studio/schema'

import { effectVars } from '../effect-vars'
import { cssVarsOf } from '../effect-vars.markup'
import { EFFECT_LAYER_CLASS } from '../shared'

import { GLOW_ORIGIN_VALUE } from './glow.styles'
import type { GlowProps } from './glow.types'

export const glowMarkup = defineMarkup<GlowProps>(
  ({ props: { tint, intensity, blur, origin, breathe, speed } }) =>
    el('div', {
      classNames: ['ms-fx', EFFECT_LAYER_CLASS],
      attributes: { 'aria-hidden': literal(true) },
      cssVars: {
        ...cssVarsOf(effectVars({ tint, intensity, speed, blur })),
        '--ms-fx-origin': GLOW_ORIGIN_VALUE[origin],
      },
      children: [
        el('span', {
          classNames: ['absolute ms-fx-glow inset-[-25%]', breathe && 'ms-fx-breathe'],
        }),
      ],
    }),
)
