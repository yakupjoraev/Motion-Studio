import type { ReactNode } from 'react'

import { HEADING_TAGS, type HeadingLevel } from './marketing.schema'
import { sectionHeadingStyles } from './marketing.styles'

export interface SectionHeadingProps {
  readonly level: HeadingLevel
  readonly size?: 'md' | 'lg'
  readonly className?: string | undefined
  readonly children: ReactNode
}

/**
 * The heading of a marketing section, at the level the document asked for.
 *
 * The tag comes from a lookup rather than from `` `h${level}` ``, and the difference is not style: a
 * template string is `string`, which React accepts as any element name, so a level of 7 would render an
 * `<h7>` that no browser knows and no test would catch. The map is exhaustive over the union.
 */
export function SectionHeading({ level, size = 'lg', className, children }: SectionHeadingProps) {
  const Tag = HEADING_TAGS[level]

  return <Tag className={className ?? sectionHeadingStyles({ size })}>{children}</Tag>
}
