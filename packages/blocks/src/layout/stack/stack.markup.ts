import { defineMarkup, el, slot } from '@motion-studio/schema'

import { stackStyles } from './stack.styles'
import type { StackProps } from './stack.types'

export const stackMarkup = defineMarkup<StackProps>(({ props }) =>
  el('div', { classNames: [stackStyles(props)], children: [slot()] }),
)
