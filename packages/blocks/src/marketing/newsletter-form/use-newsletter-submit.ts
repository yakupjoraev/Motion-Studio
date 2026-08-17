'use client'

import { useCallback, useState } from 'react'

import { type NewsletterState, emailLooksValid } from './newsletter-form.schema'

/** Why the form is in its error state. The reader needs different words for the two. */
export type NewsletterFailure = 'invalid' | 'rejected'

export interface NewsletterSubmitOptions {
  readonly onSubmit: (email: string) => void | Promise<void>
}

export interface NewsletterSubmit {
  readonly email: string
  readonly state: NewsletterState
  readonly failure: NewsletterFailure | null
  readonly setEmail: (value: string) => void
  readonly submit: () => void
}

/**
 * The form's four states, and the transitions between them.
 *
 * Kept out of the component because it is the only branching in the block, and because the state machine
 * is what the tests are actually about: an invalid address never reaches the handler, a handler that has
 * not settled holds `loading`, a resolved one gives `success`, and a rejected one gives `error` rather
 * than an unhandled rejection in the reader's console.
 *
 * `failure` splits the one error state into the two things that can be wrong, because "enter an address
 * like you@company.com" and "that did not go through" are not interchangeable — the first is the reader's
 * to fix and the second is not.
 *
 * Typing again after a failure returns to `idle`: a message about the previous attempt is wrong the
 * moment the address changes.
 */
export function useNewsletterSubmit({ onSubmit }: NewsletterSubmitOptions): NewsletterSubmit {
  const [email, setEmailValue] = useState('')
  const [state, setState] = useState<NewsletterState>('idle')
  const [failure, setFailure] = useState<NewsletterFailure | null>(null)

  const setEmail = useCallback((value: string) => {
    setEmailValue(value)
    setState((current) => (current === 'loading' ? current : 'idle'))
    setFailure(null)
  }, [])

  const submit = useCallback(() => {
    if (!emailLooksValid(email)) {
      setFailure('invalid')
      setState('error')

      return
    }

    setFailure(null)
    setState('loading')

    void Promise.resolve()
      .then(() => onSubmit(email))
      .then(() => {
        setState('success')
      })
      .catch(() => {
        setFailure('rejected')
        setState('error')
      })
  }, [email, onSubmit])

  return { email, state, failure, setEmail, submit }
}
