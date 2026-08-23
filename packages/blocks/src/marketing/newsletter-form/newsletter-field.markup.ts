import { type MarkupElement, children, el, literal, txt } from '@motion-studio/schema'

import type { NewsletterFieldShape } from './newsletter-form.schema'
import {
  NEWSLETTER_FORM,
  NEWSLETTER_LABEL,
  NEWSLETTER_NOTE,
  NEWSLETTER_PLATE,
  newsletterFieldStyles,
  newsletterMessageStyles,
  newsletterSubmitStyles,
} from './newsletter-form.styles'

export interface NewsletterFieldMarkupInput extends NewsletterFieldShape {
  /** The field and its message have to point at each other, and two forms on a page must not collide. */
  readonly id: string
}

/**
 * The field as it stands before anybody types: idle, with the message element present and empty.
 *
 * The state machine is the component's — validation, the live region's text, the busy button — and none
 * of it is markup. What the export carries is the wiring: `aria-describedby`, `aria-invalid` and the
 * live region itself, so whatever drives them later has something to say it to.
 */
export function newsletterFieldMarkup({
  label,
  showLabel,
  placeholder,
  submitLabel,
  note,
  id,
}: NewsletterFieldMarkupInput): MarkupElement {
  const fieldId = `${id}-email`
  const messageId = `${fieldId}-message`

  return el('div', {
    classNames: ['w-full'],
    attributes: { 'data-state': literal('idle') },
    children: children(
      el('form', {
        classNames: [NEWSLETTER_FORM],
        attributes: { noValidate: literal(true) },
        children: [
          el('label', {
            classNames: [showLabel ? NEWSLETTER_LABEL : 'sr-only'],
            attributes: { htmlFor: literal(fieldId) },
            children: [txt(label)],
          }),
          el('div', {
            classNames: [NEWSLETTER_PLATE],
            children: [
              el('input', {
                classNames: [newsletterFieldStyles({ invalid: false })],
                attributes: {
                  'aria-describedby': literal(messageId),
                  'aria-invalid': literal(false),
                  autoComplete: literal('email'),
                  id: literal(fieldId),
                  placeholder: literal(placeholder),
                  type: literal('email'),
                  value: literal(''),
                  name: literal('email'),
                },
              }),
              el('button', {
                classNames: [newsletterSubmitStyles({ busy: false })],
                attributes: { type: literal('submit') },
                children: [txt(submitLabel)],
              }),
            ],
          }),
        ],
      }),
      el('p', {
        classNames: [newsletterMessageStyles({ tone: 'idle' })],
        attributes: {
          'aria-live': literal('polite'),
          'data-state': literal('idle'),
          id: literal(messageId),
        },
      }),
      note !== '' && el('p', { classNames: [NEWSLETTER_NOTE], children: [txt(note)] }),
    ),
  })
}
