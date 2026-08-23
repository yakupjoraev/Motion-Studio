import { defineMarkup, el, literal } from '@motion-studio/schema'

import { effectVars } from '../effect-vars'
import { cssVarsOf } from '../effect-vars.markup'
import { EFFECT_LAYER_CLASS } from '../shared'

import { gridLinesStyles } from './grid-lines.styles'
import type { GridLinesProps } from './grid-lines.types'

export const gridLinesMarkup = defineMarkup<GridLinesProps>(
  ({ props: { tint, intensity, spacing, lineWidth, axis, fade } }) =>
    el('div', {
      classNames: ['ms-fx', EFFECT_LAYER_CLASS],
      attributes: { 'aria-hidden': literal(true) },
      cssVars: {
        ...cssVarsOf(effectVars({ tint, intensity, size: spacing })),
        '--ms-fx-line': `${lineWidth}px`,
      },
      children: [el('span', { classNames: [gridLinesStyles({ axis, fade })] })],
    }),
)
