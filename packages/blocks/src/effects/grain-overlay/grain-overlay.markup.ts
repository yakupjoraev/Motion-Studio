import { defineMarkup, el, literal } from '@motion-studio/schema'

import { effectVars } from '../effect-vars'
import { cssVarsOf } from '../effect-vars.markup'
import { EFFECT_LAYER_CLASS } from '../shared'

import { grainLayerStyles } from './grain-overlay.styles'
import type { GrainOverlayProps } from './grain-overlay.types'

export const grainOverlayMarkup = defineMarkup<GrainOverlayProps>(
  ({ props: { intensity, scale, speed, blend } }) =>
    el('div', {
      classNames: ['ms-fx', EFFECT_LAYER_CLASS],
      attributes: { 'aria-hidden': literal(true) },
      cssVars: cssVarsOf(effectVars({ intensity, speed })),
      children: [
        el('span', {
          classNames: [grainLayerStyles({ blend })],
          cssVars: { backgroundSize: `${scale}px ${scale}px` },
        }),
      ],
    }),
)
