import { defineMarkup, el, literal } from '@motion-studio/schema'

import { effectVars } from '../effect-vars'
import { cssVarsOf } from '../effect-vars.markup'
import type { BorderBeamProps } from './border-beam.types'

export const borderBeamMarkup = defineMarkup<BorderBeamProps>(
  ({ props: { tint, intensity, speed, borderWidth, arc } }) =>
    el('div', {
      classNames: ['pointer-events-none ms-fx ms-fx-border-beam overflow-hidden'],
      attributes: { 'aria-hidden': literal(true) },
      cssVars: {
        ...cssVarsOf(effectVars({ tint, intensity, speed })),
        '--ms-fx-line': `${borderWidth}px`,
        '--ms-fx-arc': `${arc}deg`,
      },
      children: [el('span', { classNames: ['ms-fx-border-beam-ring'] })],
    }),
)
