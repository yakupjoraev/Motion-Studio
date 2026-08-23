import { defineMarkup, el, slot } from '@motion-studio/schema'

import { containerClassName } from './container.styles'
import type { ContainerProps } from './container.types'

/**
 * Grid mode drops `direction` and `wrap` — the same rule the component states, read from the same
 * function, so the two cannot disagree about which class families contradict each other.
 */
export const containerMarkup = defineMarkup<ContainerProps>(({ props }) =>
  el('div', { classNames: [containerClassName(props)], children: [slot()] }),
)
