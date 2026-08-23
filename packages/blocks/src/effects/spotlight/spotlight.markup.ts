import { defineMarkup, el, literal } from '@motion-studio/schema'

import { effectVars } from '../effect-vars'
import { cssVarsOf } from '../effect-vars.markup'
import { EFFECT_LAYER_CLASS } from '../shared'

import type { SpotlightProps } from './spotlight.types'

/** Following the pointer is behaviour the component adds to this layer; the layer itself is markup. */
export const spotlightMarkup = defineMarkup<SpotlightProps>(
  ({ props: { tint, intensity, reach, followPointer } }) =>
    el('div', {
      classNames: ['ms-fx ms-fx-spotlight', EFFECT_LAYER_CLASS],
      attributes: { 'aria-hidden': literal(true), 'data-follows': literal(followPointer) },
      cssVars: {
        ...cssVarsOf(effectVars({ tint, intensity })),
        '--ms-fx-reach': `${reach}%`,
      },
    }),
)
