import { defineMarkup, el, literal } from '@motion-studio/schema'

import { effectVars } from '../effect-vars'
import { cssVarsOf } from '../effect-vars.markup'
import { EFFECT_LAYER_CLASS } from '../shared'

import type { DotGridProps } from './dot-grid.types'

export const dotGridMarkup = defineMarkup<DotGridProps>(
  ({ props: { tint, intensity, spacing, dotSize, fade } }) =>
    el('div', {
      classNames: ['ms-fx', EFFECT_LAYER_CLASS],
      attributes: { 'aria-hidden': literal(true) },
      cssVars: {
        ...cssVarsOf(effectVars({ tint, intensity, size: spacing })),
        '--ms-fx-dot': `${dotSize}px`,
      },
      children: [el('span', { classNames: ['absolute ms-fx-dots inset-0', fade && 'ms-fx-fade'] })],
    }),
)
