import { defineMarkup, el, literal } from '@motion-studio/schema'

import { effectVars } from '../effect-vars'
import { cssVarsOf } from '../effect-vars.markup'
import { EFFECT_LAYER_CLASS } from '../shared'

import { BEAM_OFFSET, beamStyle } from './beams.styles'
import type { BeamsProps } from './beams.types'

export const beamsMarkup = defineMarkup<BeamsProps>(
  ({ props: { tint, intensity, speed, count, width, angle } }) =>
    el('div', {
      classNames: ['ms-fx', EFFECT_LAYER_CLASS],
      attributes: { 'aria-hidden': literal(true) },
      cssVars: cssVarsOf(effectVars({ tint, intensity, speed, size: width, angle })),
      children: [
        el('div', {
          classNames: ['absolute inset-0 ms-fx-beams'],
          children: Array.from({ length: count }, (_unused, index) =>
            el('span', {
              classNames: ['ms-fx-beam'],
              cssVars: cssVarsOf(beamStyle(index, count, BEAM_OFFSET)),
            }),
          ),
        }),
      ],
    }),
)
