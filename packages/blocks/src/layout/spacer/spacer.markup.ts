import { defineMarkup, el, literal } from '@motion-studio/schema'

import { spacerStyles } from './spacer.styles'
import type { SpacerProps } from './spacer.types'

/** Decorative by definition: the gap is the point, so it is hidden from the accessibility tree. */
export const spacerMarkup = defineMarkup<SpacerProps>(({ props }) =>
  el('div', {
    classNames: [spacerStyles(props)],
    attributes: { 'aria-hidden': literal(true) },
  }),
)
