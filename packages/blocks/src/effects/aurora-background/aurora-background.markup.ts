import { children, defineMarkup, el, literal } from '@motion-studio/schema'

import { effectVars } from '../effect-vars'
import { cssVarsOf } from '../effect-vars.markup'
import { EFFECT_LAYER_CLASS, tintVar } from '../shared'

import { auroraFieldStyles, auroraGrainStyles } from './aurora-background.styles'
import type { AuroraBackgroundProps } from './aurora-background.types'

export const auroraBackgroundMarkup = defineMarkup<AuroraBackgroundProps>(
  ({ props: { tint, secondaryTint, intensity, speed, blur, grain, scrim } }) =>
    el('div', {
      classNames: ['ms-fx', EFFECT_LAYER_CLASS],
      attributes: { 'aria-hidden': literal(true) },
      cssVars: cssVarsOf(effectVars({ tint, intensity, speed, blur })),
      children: children(
        el('span', {
          classNames: [auroraFieldStyles({ field: 'a' })],
          cssVars: { background: tintVar(tint) },
        }),
        el('span', {
          classNames: [auroraFieldStyles({ field: 'b' })],
          cssVars: { background: tintVar(secondaryTint) },
        }),
        el('span', {
          classNames: [auroraFieldStyles({ field: 'c' })],
          cssVars: { background: tintVar(tint) },
        }),
        grain && el('span', { classNames: [auroraGrainStyles] }),
        scrim && el('span', { classNames: ['ms-fx-scrim'] }),
      ),
    }),
)
