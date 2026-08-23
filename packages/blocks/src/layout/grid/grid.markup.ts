import { defineMarkup, el, slot } from '@motion-studio/schema'

import { gridClassName } from './grid.styles'
import type { GridProps } from './grid.types'

export const gridMarkup = defineMarkup<GridProps>(({ props }) =>
  el('div', { classNames: [gridClassName(props)], children: [slot()] }),
)
