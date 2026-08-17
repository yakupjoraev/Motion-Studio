import { ActionButton } from '../action-button'
import { MARKETING_INNER, actionRowStyles, marketingSectionStyles } from '../marketing.styles'
import { SectionHeading } from '../section-heading'

import { bandIsAccent } from './cta-banner.schema'
import {
  CTA_ACTIONS,
  ctaCopyStyles,
  ctaDescriptionStyles,
  ctaEyebrowStyles,
  ctaHeadingStyles,
  ctaPanelStyles,
} from './cta-banner.styles'
import type { CtaBannerProps } from './cta-banner.types'

/**
 * The full-width band that asks for the click.
 *
 * On an accent band every piece of text and both buttons invert — `foreground-onAccent` and a
 * surface-coloured primary — because a primary button painted accent on an accent background is a button
 * nobody can see. That single fact is why `surface` is a four-value prop and not a boolean.
 */
export function CtaBanner({
  eyebrow,
  heading,
  description,
  headingLevel,
  align,
  surface,
  actions,
  hidden,
}: CtaBannerProps) {
  const onAccent = bandIsAccent(surface)

  return (
    <section
      className={marketingSectionStyles({ hidden, padding: 'compact' })}
      data-testid="cta-banner"
    >
      <div className={MARKETING_INNER}>
        <div className={ctaPanelStyles({ surface })} data-testid="cta-panel">
          <div className={ctaCopyStyles({ align })}>
            {eyebrow !== '' && <p className={ctaEyebrowStyles({ onAccent })}>{eyebrow}</p>}

            {heading !== '' && (
              <SectionHeading className={ctaHeadingStyles({ onAccent })} level={headingLevel}>
                {heading}
              </SectionHeading>
            )}

            {description !== '' && (
              <p className={ctaDescriptionStyles({ onAccent })}>{description}</p>
            )}

            {actions.length > 0 && (
              <div className={CTA_ACTIONS}>
                <div className={actionRowStyles({ align })}>
                  {actions.map((action, index) => (
                    <ActionButton
                      action={action}
                      key={`${action.label}-${index}`}
                      onAccent={onAccent}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
