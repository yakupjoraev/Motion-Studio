import { defineMarkup, el, slot } from '@motion-studio/schema'

import { sectionInnerStyles, sectionStyles } from './section.styles'
import type { SectionProps } from './section.types'

/**
 * ADR-249. The same two `cva` calls the component makes, with the same props — the class list is not
 * declared anywhere, it is produced by the one function that owns it.
 */
export const sectionMarkup = defineMarkup<SectionProps>(({ props }) =>
  el('section', {
    classNames: [sectionStyles(props)],
    children: [el('div', { classNames: [sectionInnerStyles(props)], children: [slot()] })],
  }),
)
