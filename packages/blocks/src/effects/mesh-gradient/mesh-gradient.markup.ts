import { children, defineMarkup, el, literal } from '@motion-studio/schema'

import { effectVars } from '../effect-vars'
import { cssVarsOf } from '../effect-vars.markup'
import { EFFECT_LAYER_CLASS } from '../shared'

import { meshBackground } from './mesh-gradient.styles'
import type { MeshGradientProps } from './mesh-gradient.types'

export const meshGradientMarkup = defineMarkup<MeshGradientProps>(
  ({ props: { tint, secondaryTint, tertiaryTint, intensity, speed, blur, spread, scrim } }) =>
    el('div', {
      classNames: ['ms-fx', EFFECT_LAYER_CLASS],
      attributes: { 'aria-hidden': literal(true) },
      cssVars: cssVarsOf(effectVars({ intensity, speed, blur })),
      children: children(
        el('span', {
          classNames: ['absolute inset-[-20%] ms-fx-mesh'],
          cssVars: {
            backgroundImage: meshBackground([tint, secondaryTint, tertiaryTint], spread),
          },
        }),
        scrim && el('span', { classNames: ['ms-fx-scrim'] }),
      ),
    }),
)
