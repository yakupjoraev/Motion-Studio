import type { ReactNode } from 'react'

import type { SectionCopyShape } from './marketing.schema'
import {
  MARKETING_INNER,
  MARKETING_INNER_WIDE,
  SECTION_CONTENT,
  marketingSectionStyles,
} from './marketing.styles'
import { SectionHeader } from './section-header'

export interface MarketingSectionProps {
  readonly copy: SectionCopyShape
  readonly hidden: boolean
  readonly padding?: 'none' | 'compact' | 'default'
  /** The two CTA bands run to `max-w-7xl`; everything else holds the reading measure. */
  readonly wide?: boolean
  readonly headingSize?: 'md' | 'lg'
  readonly testId: string
  readonly children: ReactNode
}

/**
 * The band every marketing block is: a `<section>`, the measure inside it, the shared header, and the
 * block's own content below.
 *
 * It exists for the reason `HeroCopy` does (ADR-118): the vertical rhythm of a page is one decision, and
 * twelve transcriptions of `py-16 md:py-24 lg:py-32` drift on the first edit. What a block still owns is
 * everything below the header — this element has no opinion about that.
 *
 * `SECTION_CONTENT` is applied only when there is a header to be spaced from, so a section with the
 * three copy fields cleared starts flush.
 */
export function MarketingSection({
  copy,
  hidden,
  padding = 'default',
  wide = false,
  headingSize = 'lg',
  testId,
  children,
}: MarketingSectionProps) {
  const header = (
    <SectionHeader
      description={copy.description}
      eyebrow={copy.eyebrow}
      heading={copy.heading}
      headingAlign={copy.headingAlign}
      headingLevel={copy.headingLevel}
      size={headingSize}
    />
  )

  const hasHeader = copy.eyebrow !== '' || copy.heading !== '' || copy.description !== ''

  return (
    <section className={marketingSectionStyles({ hidden, padding })} data-testid={testId}>
      <div className={wide ? MARKETING_INNER_WIDE : MARKETING_INNER}>
        {header}
        <div className={hasHeader ? SECTION_CONTENT : 'w-full'}>{children}</div>
      </div>
    </section>
  )
}
