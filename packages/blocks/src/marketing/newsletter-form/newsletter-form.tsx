import { SectionHeading } from '../section-heading'

import { NewsletterField } from './newsletter-field'
import {
  NEWSLETTER_DESCRIPTION,
  NEWSLETTER_HEADING,
  newsletterStackStyles,
} from './newsletter-form.styles'
import type { NewsletterFormProps } from './newsletter-form.types'

/**
 * A heading, a sentence, and the form.
 *
 * **The handler is a prop and its default does nothing**, deliberately: a block must not invent a backend,
 * and a form that silently accepted an address would be worse than one that admits it goes nowhere. The
 * codegen descriptor carries the note the export emits above the component (ADR-185), so the reader of the
 * generated file is told where theirs goes rather than discovering it in production.
 */
export function NewsletterForm({
  heading,
  description,
  headingLevel,
  hidden,
  onSubmit,
  ...field
}: NewsletterFormProps) {
  return (
    <div className={newsletterStackStyles({ hidden })} data-testid="newsletter-form">
      {heading !== '' && (
        <SectionHeading className={NEWSLETTER_HEADING} level={headingLevel}>
          {heading}
        </SectionHeading>
      )}

      {description !== '' && <p className={NEWSLETTER_DESCRIPTION}>{description}</p>}

      <div className="mt-6">
        <NewsletterField {...field} onSubmit={onSubmit} />
      </div>
    </div>
  )
}
