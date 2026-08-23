import { defineMarkup, el, literal } from '@motion-studio/schema'

import { effectVars } from '../effect-vars'
import { cssVarsOf } from '../effect-vars.markup'
import { EFFECT_LAYER_CLASS } from '../shared'

import type { ShineProps } from './shine.types'

export const shineMarkup = defineMarkup<ShineProps>(
  ({ props: { tint, intensity, speed, width, angle } }) =>
    el('div', {
      classNames: ['ms-fx', EFFECT_LAYER_CLASS],
      attributes: { 'aria-hidden': literal(true) },
      cssVars: cssVarsOf(effectVars({ tint, intensity, speed, angle })),
      children: [el('span', { classNames: ['ms-fx-shine'], cssVars: { width: `${width}%` } })],
    }),
)
