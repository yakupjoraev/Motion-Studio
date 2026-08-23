import { defineMarkup, el, literal } from '@motion-studio/schema'

import { txt } from '@motion-studio/schema'
import { controlStyles } from '../../interactive/interactive.styles'
import { fieldIds } from '../field-ids'
import { fieldShellMarkup, inputControlMarkup } from '../field-shell.markup'
import { honeypotMarkup } from '../form-actions.markup'
import { formMessageStyles } from '../forms.styles'

import { WAITLIST_NOTE, WAITLIST_ROW, waitlistFrameStyles } from './waitlist-form.styles'
import type { WaitlistFormProps } from './waitlist-form.types'

import { children } from '@motion-studio/schema'

/** The form as it opens: idle, empty, with the live region already in the document. */
export const waitlistFormMarkup = defineMarkup<WaitlistFormProps>(
  ({ props: { label, showLabel, hint, placeholder, submitLabel, note, hidden }, id }) => {
    const ids = fieldIds(id, hint !== '')

    return el('div', {
      classNames: [waitlistFrameStyles({ hidden })],
      children: [
        el('form', {
          attributes: { 'data-state': literal('idle'), noValidate: literal(true) },
          children: children(
            el('div', {
              classNames: [WAITLIST_ROW],
              children: [
                el('div', {
                  classNames: ['min-w-0 flex-1'],
                  children: [
                    fieldShellMarkup({
                      error: '',
                      hint,
                      ids,
                      label,
                      labelVisible: showLabel,
                      required: true,
                      control: inputControlMarkup({
                        autoComplete: 'email',
                        disabled: false,
                        ids,
                        invalid: false,
                        multiline: false,
                        name: 'email',
                        placeholder,
                        required: true,
                        rows: 1,
                        type: 'email',
                      }),
                    }),
                  ],
                }),
                el('button', {
                  classNames: [controlStyles({ variant: 'primary', size: 'md' })],
                  attributes: { type: literal('submit') },
                  children: [txt(submitLabel)],
                }),
              ],
            }),
            honeypotMarkup(`${id}-reference`),
            el('p', {
              classNames: [formMessageStyles({ tone: 'idle' })],
              attributes: { 'aria-live': literal('polite'), 'data-state': literal('idle') },
            }),
            note !== '' && el('p', { classNames: [WAITLIST_NOTE], children: [txt(note)] }),
          ),
        }),
      ],
    })
  },
)
