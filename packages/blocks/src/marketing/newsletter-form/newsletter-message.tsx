import type { NewsletterState } from './newsletter-form.schema'
import { newsletterMessageStyles } from './newsletter-form.styles'

export interface NewsletterMessageProps {
  readonly id: string
  readonly state: NewsletterState
  readonly text: string
}

/**
 * What the form is saying right now.
 *
 * One element for all four states, and it is a live region: a reader whose focus is still in the field has
 * to be told the submission succeeded without going looking for the sentence. `assertive` for the error
 * (it blocks them) and `polite` for the rest (it does not).
 *
 * The element stays mounted while idle so the region exists before it has anything to announce — a live
 * region added to the DOM at the same moment as its text is a region most screen readers do not read.
 */
export function NewsletterMessage({ id, state, text }: NewsletterMessageProps) {
  return (
    <p
      aria-live={state === 'error' ? 'assertive' : 'polite'}
      className={newsletterMessageStyles({ tone: state })}
      data-state={state}
      data-testid="newsletter-message"
      id={id}
    >
      {text}
    </p>
  )
}
