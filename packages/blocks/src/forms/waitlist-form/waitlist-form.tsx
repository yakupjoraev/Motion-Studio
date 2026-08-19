'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { LoadingIcon } from '@motion-studio/icons'
import { useId, useMemo } from 'react'
import { useForm } from 'react-hook-form'

import { controlStyles } from '../../interactive/interactive.styles'
import { fieldIds } from '../field-ids'
import { FieldShell } from '../field-shell'
import { formMessageStyles } from '../forms.styles'
import { HONEYPOT_NAME, Honeypot } from '../honeypot'
import { InputControl } from '../input-control'
import { SuccessPanel } from '../success-panel'
import { useFormSubmit } from '../use-form-submit'

import { type WaitlistValues, waitlistValuesSchema } from './waitlist-form.schema'
import { WAITLIST_NOTE, WAITLIST_ROW, waitlistFrameStyles } from './waitlist-form.styles'
import type { WaitlistFormProps } from './waitlist-form.types'

const EMPTY: WaitlistValues = { email: '', reference: '' }

/**
 * One field and a button, and the same wiring as everything else in the category.
 *
 * Compact means the label is `sr-only` by default, **not** that there is no label: a placeholder disappears the
 * moment the reader starts typing, and a form whose only label was a placeholder is a form they cannot check what
 * they answered. The element is always in the markup and `showLabel` only decides whether it is drawn.
 *
 * `onSubmit` is a prop whose default does nothing, for the reason `contact-form` gives: a block must not invent a
 * backend, and the codegen descriptor's note is what tells the reader of the generated file where theirs goes.
 *
 * On success the row is replaced inline by a panel that takes focus — the field the reader was in has just left
 * the document.
 */
export function WaitlistForm({
  label,
  showLabel,
  hint,
  placeholder,
  invalidMessage,
  submitLabel,
  submittingLabel,
  successTitle,
  successBody,
  failureMessage,
  note,
  hidden,
  onSubmit = () => undefined,
}: WaitlistFormProps) {
  const base = useId()
  const values = useMemo(() => waitlistValuesSchema(invalidMessage), [invalidMessage])

  const { formState, handleSubmit, register } = useForm<WaitlistValues>({
    defaultValues: EMPTY,
    resolver: zodResolver(values),
  })

  const { state, submit, succeed } = useFormSubmit<WaitlistValues>(onSubmit)
  const ids = fieldIds(base, hint !== '')
  const busy = state === 'submitting'

  if (state === 'success') {
    return (
      <div className={waitlistFrameStyles({ hidden })} data-testid="waitlist-form">
        <SuccessPanel body={successBody} title={successTitle} />
      </div>
    )
  }

  return (
    <div className={waitlistFrameStyles({ hidden })} data-testid="waitlist-form">
      <form
        data-state={state}
        data-testid="waitlist-form-element"
        // The browser's own bubble would say the same thing in a place the block can neither style nor announce.
        noValidate
        onSubmit={handleSubmit(async (submitted) => {
          if (submitted[HONEYPOT_NAME].trim() !== '') {
            succeed()

            return
          }

          await submit(submitted)
        })}
      >
        <div className={WAITLIST_ROW}>
          <div className="min-w-0 flex-1">
            <FieldShell
              error={formState.errors.email?.message ?? ''}
              hint={hint}
              ids={ids}
              label={label}
              labelVisible={showLabel}
              required
            >
              <InputControl
                autoComplete="email"
                disabled={false}
                ids={ids}
                invalid={formState.errors.email !== undefined}
                multiline={false}
                name="email"
                placeholder={placeholder}
                registration={register('email')}
                required
                rows={1}
                type="email"
              />
            </FieldShell>
          </div>

          <button
            aria-busy={busy ? true : undefined}
            className={controlStyles({ variant: 'primary', size: 'md' })}
            data-testid="form-submit"
            disabled={busy}
            type="submit"
          >
            {busy && <LoadingIcon aria-hidden="true" className="ms-spin shrink-0" size={18} />}
            {busy ? submittingLabel : submitLabel}
          </button>
        </div>

        <Honeypot id={`${base}-reference`} registration={register(HONEYPOT_NAME)} />

        <p
          aria-live={state === 'error' ? 'assertive' : 'polite'}
          className={formMessageStyles({ tone: state })}
          data-state={state}
          data-testid="form-message"
        >
          {state === 'error' ? failureMessage : ''}
        </p>

        {note !== '' && <p className={WAITLIST_NOTE}>{note}</p>}
      </form>
    </div>
  )
}
