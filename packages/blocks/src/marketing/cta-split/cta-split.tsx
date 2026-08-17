import { ActionButton } from '../action-button'
import { MARKETING_INNER, actionRowStyles, marketingSectionStyles } from '../marketing.styles'
import { NewsletterField } from '../newsletter-form/newsletter-field'
import { SectionHeading } from '../section-heading'

import {
  CTA_SPLIT_COPY,
  CTA_SPLIT_DESCRIPTION,
  CTA_SPLIT_EYEBROW,
  CTA_SPLIT_GRID,
  CTA_SPLIT_HEADING,
  CTA_SPLIT_SIDE,
  ctaSplitPanelStyles,
} from './cta-split.styles'
import type { CtaSplitProps } from './cta-split.types'

/**
 * Copy on one side, and either a form or a pair of buttons on the other.
 *
 * The form is `NewsletterField` — the same field, state machine and accessible wiring `newsletter-form`
 * ships, so the two blocks cannot drift into two ways of validating an email address. Its handler is the
 * same no-op prop, and this block carries the same codegen note about replacing it.
 */
export function CtaSplit({
  eyebrow,
  heading,
  description,
  headingLevel,
  side,
  surface,
  actions,
  hidden,
  onSubmit,
  label,
  showLabel,
  placeholder,
  submitLabel,
  invalidMessage,
  successMessage,
  errorMessage,
  note,
}: CtaSplitProps) {
  return (
    <section
      className={marketingSectionStyles({ hidden, padding: 'compact' })}
      data-testid="cta-split"
    >
      <div className={MARKETING_INNER}>
        <div className={ctaSplitPanelStyles({ surface })} data-testid="cta-split-panel">
          <div className={CTA_SPLIT_GRID}>
            <div className={CTA_SPLIT_COPY}>
              {eyebrow !== '' && <p className={CTA_SPLIT_EYEBROW}>{eyebrow}</p>}

              {heading !== '' && (
                <SectionHeading className={CTA_SPLIT_HEADING} level={headingLevel}>
                  {heading}
                </SectionHeading>
              )}

              {description !== '' && <p className={CTA_SPLIT_DESCRIPTION}>{description}</p>}
            </div>

            <div className={CTA_SPLIT_SIDE}>
              {side === 'form' ? (
                <NewsletterField
                  errorMessage={errorMessage}
                  invalidMessage={invalidMessage}
                  label={label}
                  note={note}
                  onSubmit={onSubmit}
                  placeholder={placeholder}
                  showLabel={showLabel}
                  submitLabel={submitLabel}
                  successMessage={successMessage}
                />
              ) : (
                <div
                  className={actionRowStyles({ align: 'start' })}
                  data-testid="cta-split-actions"
                >
                  {actions.map((action, index) => (
                    <ActionButton action={action} key={`${action.label}-${index}`} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
