import { type MarkupElement, children, el, txt } from '@motion-studio/schema'

import type { HeadingLevel } from './marketing.schema'
import {
  SECTION_DESCRIPTION,
  SECTION_EYEBROW,
  sectionHeaderStyles,
  sectionHeadingStyles,
} from './marketing.styles'
import { sectionHeadingMarkup } from './section-heading.markup'

export interface SectionHeaderMarkupInput {
  readonly eyebrow: string
  readonly heading: string
  readonly description: string
  readonly headingLevel: HeadingLevel
  readonly headingAlign: 'start' | 'center' | 'end'
  readonly size?: 'md' | 'lg'
}

/**
 * `SectionHeader` as markup. Each line decides for itself whether it has anything to say, and three
 * empty ones produce nothing at all — the same rule, because a 96 px hole in an exported page is the
 * same defect as one on the canvas.
 */
export function sectionHeaderMarkup({
  eyebrow,
  heading,
  description,
  headingLevel,
  headingAlign,
  size = 'lg',
}: SectionHeaderMarkupInput): MarkupElement | null {
  if (eyebrow === '' && heading === '' && description === '') {
    return null
  }

  return el('header', {
    classNames: [sectionHeaderStyles({ headingAlign })],
    children: children(
      eyebrow !== '' && el('p', { classNames: [SECTION_EYEBROW], children: [txt(eyebrow)] }),
      heading !== '' &&
        sectionHeadingMarkup({
          level: headingLevel,
          className: sectionHeadingStyles({ size }),
          children: [txt(heading)],
        }),
      description !== '' &&
        el('p', { classNames: [SECTION_DESCRIPTION], children: [txt(description)] }),
    ),
  })
}
