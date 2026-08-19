'use client'

import { useCallback, useState } from 'react'

import type { FormState } from './forms.schema'

export interface FormSubmit<V> {
  readonly state: FormState
  readonly submit: (values: V) => Promise<void>
  /** Success without the handler being called — the honeypot's answer, and its only caller. */
  readonly succeed: () => void
  readonly reset: () => void
}

/**
 * The four states a submitting form moves through, and the transitions between them.
 *
 * Kept out of the components because it is the only branching either form block has, and because the state
 * machine is what the tests are actually about: a handler that has not settled holds `submitting`, a resolved one
 * gives `success`, and a rejected one gives `error` rather than an unhandled rejection in the reader's console.
 *
 * `spam` is not a state. A filled honeypot resolves to `success` without the handler being called at all, which is
 * the whole point of the trap — see `honeypot.tsx`.
 */
export function useFormSubmit<V>(onSubmit: (values: V) => void | Promise<void>): FormSubmit<V> {
  const [state, setState] = useState<FormState>('idle')

  const submit = useCallback(
    async (values: V) => {
      setState('submitting')

      try {
        await onSubmit(values)
        setState('success')
      } catch {
        setState('error')
      }
    },
    [onSubmit],
  )

  const succeed = useCallback(() => {
    setState('success')
  }, [])

  const reset = useCallback(() => {
    setState('idle')
  }, [])

  return { state, submit, succeed, reset }
}
