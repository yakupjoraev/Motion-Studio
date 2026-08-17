import type { HeadingLevel } from './marketing.schema'
import {
  SECTION_DESCRIPTION,
  SECTION_EYEBROW,
  sectionHeaderStyles,
  sectionHeadingStyles,
} from './marketing.styles'
import { SectionHeading } from './section-heading'

export interface SectionHeaderProps {
  readonly eyebrow: string
  readonly heading: string
  readonly description: string
  readonly headingLevel: HeadingLevel
  readonly headingAlign: 'start' | 'center' | 'end'
  readonly size?: 'md' | 'lg'
}

/**
 * Eyebrow, heading, description — the three lines that open a marketing section, at the rhythm
 * `marketing.styles.ts` states.
 *
 * Each line decides for itself whether it has anything to say, and the header as a whole disappears
 * when none of them do: a user who cleared all three wants the content flush against the band, not a
 * 96 px hole where a header used to be.
 */
export function SectionHeader({
  eyebrow,
  heading,
  description,
  headingLevel,
  headingAlign,
  size = 'lg',
}: SectionHeaderProps) {
  if (eyebrow === '' && heading === '' && description === '') {
    return null
  }

  return (
    <header className={sectionHeaderStyles({ headingAlign })}>
      {eyebrow !== '' && <p className={SECTION_EYEBROW}>{eyebrow}</p>}

      {heading !== '' && (
        <SectionHeading className={sectionHeadingStyles({ size })} level={headingLevel}>
          {heading}
        </SectionHeading>
      )}

      {description !== '' && <p className={SECTION_DESCRIPTION}>{description}</p>}
    </header>
  )
}
