'use client'

import { useId } from 'react'

import type { NewsletterFieldShape } from './newsletter-form.schema'
import {
  NEWSLETTER_FORM,
  NEWSLETTER_LABEL,
  NEWSLETTER_NOTE,
  NEWSLETTER_PLATE,
  newsletterFieldStyles,
  newsletterSubmitStyles,
} from './newsletter-form.styles'
import { NewsletterMessage } from './newsletter-message'
import { useNewsletterSubmit } from './use-newsletter-submit'

export type NewsletterFieldProps = NewsletterFieldShape & {
  readonly onSubmit?: ((email: string) => void | Promise<void>) | undefined
}

/**
 * The form itself: a label, an email field, a button, and one message that carries all four states.
 *
 * Separate from `NewsletterForm` because `cta-split` puts this beside its own copy — the same field, the
 * same state machine, the same accessible wiring, without the heading this block owns.
 *
 * Validation reaches the reader three ways: `aria-invalid` on the field, `aria-describedby` pointing at the
 * message, and the message itself in a live region. One of the three is enough for a sighted reader and
 * none of the three is enough on its own.
 */
export function NewsletterField({
  label,
  showLabel,
  placeholder,
  submitLabel,
  invalidMessage,
  successMessage,
  errorMessage,
  note,
  onSubmit = () => undefined,
}: NewsletterFieldProps) {
  const fieldId = useId()
  const messageId = `${fieldId}-message`
  const { email, state, failure, setEmail, submit } = useNewsletterSubmit({ onSubmit })

  const message =
    state === 'success'
      ? successMessage
      : state === 'error'
        ? failure === 'invalid'
          ? invalidMessage
          : errorMessage
        : ''

  return (
    <div className="w-full" data-state={state} data-testid="newsletter-field">
      <form
        className={NEWSLETTER_FORM}
        // The browser's bubble would say the same thing in a place the block cannot style or announce.
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <label className={showLabel ? NEWSLETTER_LABEL : 'sr-only'} htmlFor={fieldId}>
          {label}
        </label>

        <div className={NEWSLETTER_PLATE}>
          <input
            aria-describedby={messageId}
            aria-invalid={state === 'error'}
            autoComplete="email"
            className={newsletterFieldStyles({ invalid: state === 'error' })}
            data-testid="newsletter-input"
            id={fieldId}
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder={placeholder}
            type="email"
            value={email}
          />

          <button
            className={newsletterSubmitStyles({ busy: state === 'loading' })}
            data-testid="newsletter-submit"
            disabled={state === 'loading'}
            type="submit"
          >
            {submitLabel}
          </button>
        </div>
      </form>

      <NewsletterMessage id={messageId} state={state} text={message} />

      {note !== '' && <p className={NEWSLETTER_NOTE}>{note}</p>}
    </div>
  )
}
