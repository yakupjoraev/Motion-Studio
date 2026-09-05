import { defineMarkup, el, slot } from '@motion-studio/schema'

import { gridClassName } from './grid.styles'
import type { GridProps } from './grid.types'

export const gridMarkup = defineMarkup<GridProps>(({ props }) =>
  el('div', {
    classNames: [gridClassName(props)],
    // Matches the component: a scrolling region needs a keyboard route in (WCAG 2.1.1).
    ...(props.narrow === 'slider'
      ? { attributes: { tabindex: { kind: 'literal' as const, value: '0' } } }
      : {}),
    children: [slot()],
  }),
)
