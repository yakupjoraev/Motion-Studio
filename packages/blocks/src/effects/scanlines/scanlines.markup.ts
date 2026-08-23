import { defineMarkup, el, literal } from '@motion-studio/schema'

import { effectVars } from '../effect-vars'
import { cssVarsOf } from '../effect-vars.markup'
import { EFFECT_LAYER_CLASS } from '../shared'

import type { ScanlinesProps } from './scanlines.types'

export const scanlinesMarkup = defineMarkup<ScanlinesProps>(
  ({ props: { tint, intensity, speed, spacing, lineWidth, drift } }) =>
    el('div', {
      classNames: ['ms-fx', EFFECT_LAYER_CLASS],
      attributes: { 'aria-hidden': literal(true) },
      cssVars: {
        ...cssVarsOf(effectVars({ tint, intensity, speed, size: spacing })),
        '--ms-fx-line': `${lineWidth}px`,
      },
      children: [
        el('span', {
          classNames: ['absolute ms-fx-scanlines inset-0', drift && 'ms-fx-scanlines-drift'],
        }),
      ],
    }),
)
