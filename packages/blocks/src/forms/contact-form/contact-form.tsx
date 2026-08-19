'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useMemo } from 'react'
import { useForm } from 'react-hook-form'

import { fieldIds } from '../field-ids'
import { FormActions } from '../form-actions'
import { FormField } from '../form-field'
import { HONEYPOT_NAME, Honeypot } from '../honeypot'
import { SuccessPanel } from '../success-panel'
import { useFormSubmit } from '../use-form-submit'

import { type ContactValues, contactValuesSchema } from './contact-form.schema'
import {
  CONTACT_HEADER_GAP,
  CONTACT_NOTE,
  CONTACT_STACK,
  contactFrameStyles,
} from './contact-form.styles'
import type { ContactFormProps } from './contact-form.types'
import { ContactHeader } from './contact-header'

const EMPTY: ContactValues = { name: '', email: '', message: '', reference: '' }

/**
 * Name, email, message, submit — validated, announced, and going nowhere until the reader supplies a handler.
 *
 * **`onSubmit` is a prop whose default does nothing.** A block must not invent a backend, and a form that silently
 * accepted a message would be worse than one that admits it goes nowhere; the codegen descriptor carries the note
 * the export writes above the component, so the reader of the generated file is told where theirs goes rather than
 * discovering it in production.
 *
 * React Hook Form with a Zod resolver, which is the use `TECH_STACK.md` § Validation and data names. Two of its
 * behaviours are load-bearing rather than incidental: it moves focus to the first invalid field on a failed submit
 * (its `shouldFocusError` default, reached through the `ref` in each field's registration), and it re-validates
 * that field as the reader fixes it, so the message under it goes away when it stops being true.
 *
 * On success the form is **replaced** by a panel that takes focus. The form the reader was in has just left the
 * document, so their focus would otherwise fall to the top of the page with nothing said about why.
 */
export function ContactForm({
  heading,
  description,
  headingLevel,
  name,
  email,
  message,
  submitLabel,
  submittingLabel,
  successTitle,
  successBody,
  failureMessage,
  note,
  hidden,
  onSubmit = () => undefined,
}: ContactFormProps) {
  const base = useId()
  const values = useMemo(
    () => contactValuesSchema({ name, email, message }),
    [name, email, message],
  )

  const { formState, handleSubmit, register } = useForm<ContactValues>({
    defaultValues: EMPTY,
    resolver: zodResolver(values),
  })

  const { state, submit, succeed } = useFormSubmit<ContactValues>(onSubmit)

  const ids = {
    name: fieldIds(`${base}-name`, name.hint !== ''),
    email: fieldIds(`${base}-email`, email.hint !== ''),
    message: fieldIds(`${base}-message`, message.hint !== ''),
  }

  if (state === 'success') {
    return (
      <div className={contactFrameStyles({ hidden })} data-testid="contact-form">
        <div className={CONTACT_STACK}>
          <SuccessPanel body={successBody} title={successTitle} />
        </div>
      </div>
    )
  }

  return (
    <div className={contactFrameStyles({ hidden })} data-testid="contact-form">
      <ContactHeader description={description} heading={heading} level={headingLevel} />

      <form
        className={`${CONTACT_STACK} ${heading === '' && description === '' ? '' : CONTACT_HEADER_GAP}`}
        data-state={state}
        data-testid="contact-form-element"
        // The browser's own bubble would say the same thing in a place the block can neither style nor announce.
        noValidate
        onSubmit={handleSubmit(async (submitted) => {
          // A filled trap succeeds without the handler running. Telling a bot it failed teaches it what to change.
          if (submitted[HONEYPOT_NAME].trim() !== '') {
            succeed()

            return
          }

          await submit(submitted)
        })}
      >
        <FormField
          autoComplete="name"
          disabled={false}
          error={formState.errors.name?.message ?? ''}
          hint={name.hint}
          ids={ids.name}
          label={name.label}
          multiline={false}
          placeholder={name.placeholder}
          registration={register('name')}
          required
          rows={1}
          type="text"
        />

        <FormField
          autoComplete="email"
          disabled={false}
          error={formState.errors.email?.message ?? ''}
          hint={email.hint}
          ids={ids.email}
          label={email.label}
          multiline={false}
          placeholder={email.placeholder}
          registration={register('email')}
          required
          rows={1}
          type="email"
        />

        <FormField
          autoComplete=""
          disabled={false}
          error={formState.errors.message?.message ?? ''}
          hint={message.hint}
          ids={ids.message}
          label={message.label}
          multiline
          placeholder={message.placeholder}
          registration={register('message')}
          required
          rows={5}
          type="text"
        />

        <Honeypot id={`${base}-reference`} registration={register(HONEYPOT_NAME)} />

        <FormActions
          failureMessage={failureMessage}
          messageId={`${base}-message-region`}
          note={note}
          noteClassName={CONTACT_NOTE}
          state={state}
          submitLabel={submitLabel}
          submittingLabel={submittingLabel}
        />
      </form>
    </div>
  )
}
