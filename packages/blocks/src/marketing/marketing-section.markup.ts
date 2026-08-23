import { type MarkupChild, type MarkupElement, children, el } from '@motion-studio/schema'

import type { SectionCopyShape } from './marketing.schema'
import {
  MARKETING_INNER,
  MARKETING_INNER_WIDE,
  SECTION_CONTENT,
  marketingSectionStyles,
} from './marketing.styles'
import { sectionHeaderMarkup } from './section-header.markup'

export interface MarketingSectionMarkupInput {
  readonly copy: SectionCopyShape
  readonly hidden: boolean
  readonly padding?: 'none' | 'compact' | 'default'
  readonly wide?: boolean
  readonly headingSize?: 'md' | 'lg'
  readonly children: readonly MarkupChild[]
}

/**
 * `MarketingSection` as markup — the band eight blocks are. The vertical rhythm is one decision
 * (ADR-118) and it stays one in the export: this producer calls the same `cva` the component does.
 */
export function marketingSectionMarkup({
  copy,
  hidden,
  padding = 'default',
  wide = false,
  headingSize = 'lg',
  children: content,
}: MarketingSectionMarkupInput): MarkupElement {
  const header = sectionHeaderMarkup({
    description: copy.description,
    eyebrow: copy.eyebrow,
    heading: copy.heading,
    headingAlign: copy.headingAlign,
    headingLevel: copy.headingLevel,
    size: headingSize,
  })

  return el('section', {
    classNames: [marketingSectionStyles({ hidden, padding })],
    children: [
      el('div', {
        classNames: [wide ? MARKETING_INNER_WIDE : MARKETING_INNER],
        children: children(
          header,
          el('div', {
            classNames: [header === null ? 'w-full' : SECTION_CONTENT],
            children: content,
          }),
        ),
      }),
    ],
  })
}
