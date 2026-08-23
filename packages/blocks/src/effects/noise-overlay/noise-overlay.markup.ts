import { defineMarkup, el, literal } from '@motion-studio/schema'

import { effectVars } from '../effect-vars'
import { cssVarsOf } from '../effect-vars.markup'
import { EFFECT_LAYER_CLASS } from '../shared'

import { noiseLayerStyles } from './noise-overlay.styles'
import type { NoiseOverlayProps } from './noise-overlay.types'

export const noiseOverlayMarkup = defineMarkup<NoiseOverlayProps>(
  ({ props: { intensity, scale, blend } }) =>
    el('div', {
      classNames: ['ms-fx', EFFECT_LAYER_CLASS],
      attributes: { 'aria-hidden': literal(true) },
      cssVars: cssVarsOf(effectVars({ intensity })),
      children: [
        el('span', {
          classNames: [noiseLayerStyles({ blend })],
          cssVars: { backgroundSize: `${scale}px ${scale}px` },
        }),
      ],
    }),
)
