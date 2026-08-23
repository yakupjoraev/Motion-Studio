import { type MarkupChild, children, el, literal, txt } from '@motion-studio/schema'

import { controlStyles } from '../interactive/interactive.styles'

import { FORM_ACTIONS, HONEYPOT, formMessageStyles } from './forms.styles'

/** The trap, hidden from everybody who is not a bot filling every field it finds. */
export const honeypotMarkup = (id: string) =>
  el('div', {
    classNames: [HONEYPOT],
    attributes: { 'aria-hidden': literal('true') },
    children: [
      el('label', { attributes: { htmlFor: literal(id) }, children: [txt('Reference')] }),
      el('input', {
        attributes: {
          autoComplete: literal('off'),
          id: literal(id),
          tabIndex: literal(-1),
          type: literal('text'),
          name: literal('reference'),
        },
      }),
    ],
  })

export interface FormActionsMarkupInput {
  readonly submitLabel: string
  readonly note: string
  readonly noteClassName: string
  readonly messageId?: string | undefined
}

/**
 * The submit row and the live region under it, idle. What the button says while a submission is in
 * flight is state, and state is the component's.
 */
export const formActionsMarkup = ({
  submitLabel,
  note,
  noteClassName,
  messageId,
}: FormActionsMarkupInput): readonly MarkupChild[] => [
  el('div', {
    classNames: [FORM_ACTIONS],
    children: children(
      el('button', {
        classNames: [controlStyles({ variant: 'primary', size: 'md' })],
        attributes: { type: literal('submit') },
        children: [txt(submitLabel)],
      }),
      note !== '' && el('p', { classNames: [noteClassName], children: [txt(note)] }),
    ),
  }),
  el('p', {
    classNames: [formMessageStyles({ tone: 'idle' })],
    attributes: {
      'aria-live': literal('polite'),
      'data-state': literal('idle'),
      ...(messageId === undefined ? {} : { id: literal(messageId) }),
    },
  }),
]
