import { type MarkupChild, type MarkupElement, el, literal } from '@motion-studio/schema'

import { HEADING_TAGS, type HeadingLevel } from './marketing.schema'
import { sectionHeadingStyles } from './marketing.styles'

export interface SectionHeadingMarkupInput {
  readonly level: HeadingLevel
  readonly size?: 'md' | 'lg'
  readonly id?: string | undefined
  readonly className?: string | undefined
  readonly children: readonly MarkupChild[]
}

/** `SectionHeading` as markup — the same lookup, so an export cannot print an `<h7>` either. */
export const sectionHeadingMarkup = ({
  level,
  size = 'lg',
  id,
  className,
  children,
}: SectionHeadingMarkupInput): MarkupElement =>
  el(HEADING_TAGS[level], {
    classNames: [className ?? sectionHeadingStyles({ size })],
    ...(id === undefined ? {} : { attributes: { id: literal(id) } }),
    children,
  })
