import type { HeadingLevel } from '../../marketing/marketing.schema'
import { SectionHeading } from '../../marketing/section-heading'

import { CONTACT_DESCRIPTION, CONTACT_HEADING } from './contact-form.styles'

export interface ContactHeaderProps {
  readonly heading: string
  readonly description: string
  readonly level: HeadingLevel
}

/**
 * The words above the form.
 *
 * The heading level is a prop and it goes through `marketing`'s `SectionHeading`, which is the one place in the
 * repository that turns a level into a tag — a form dropped under an `h2` needs an `h3`, and a block that
 * hard-coded one would make the page skip a level.
 */
export function ContactHeader({ heading, description, level }: ContactHeaderProps) {
  if (heading === '' && description === '') {
    return null
  }

  return (
    <div data-testid="contact-header">
      {heading !== '' && (
        <SectionHeading className={CONTACT_HEADING} level={level}>
          {heading}
        </SectionHeading>
      )}
      {description !== '' && <p className={CONTACT_DESCRIPTION}>{description}</p>}
    </div>
  )
}
