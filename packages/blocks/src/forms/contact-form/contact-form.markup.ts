import { children, defineMarkup, el, literal, txt } from '@motion-studio/schema'
import { cn } from '@motion-studio/utils'

import { sectionHeadingMarkup } from '../../marketing/section-heading.markup'
import { fieldIds } from '../field-ids'
import { fieldShellMarkup, inputControlMarkup } from '../field-shell.markup'
import { formActionsMarkup, honeypotMarkup } from '../form-actions.markup'

import {
  CONTACT_DESCRIPTION,
  CONTACT_HEADER_GAP,
  CONTACT_HEADING,
  CONTACT_NOTE,
  CONTACT_STACK,
  contactFrameStyles,
} from './contact-form.styles'
import type { ContactFormProps } from './contact-form.types'

export const contactFormMarkup = defineMarkup<ContactFormProps>(
  ({
    props: { heading, description, headingLevel, name, email, message, submitLabel, note, hidden },
    id,
  }) => {
    const ids = {
      name: fieldIds(`${id}-name`, name.hint !== ''),
      email: fieldIds(`${id}-email`, email.hint !== ''),
      message: fieldIds(`${id}-message`, message.hint !== ''),
    }

    const field = (
      shape: { readonly label: string; readonly hint: string; readonly placeholder: string },
      key: 'name' | 'email' | 'message',
      type: string,
      autoComplete: string,
      multiline: boolean,
      rows: number,
    ) =>
      fieldShellMarkup({
        error: '',
        hint: shape.hint,
        ids: ids[key],
        label: shape.label,
        required: true,
        control: inputControlMarkup({
          autoComplete,
          disabled: false,
          ids: ids[key],
          invalid: false,
          multiline,
          name: key,
          placeholder: shape.placeholder,
          required: true,
          rows,
          type,
        }),
      })

    return el('div', {
      classNames: [contactFrameStyles({ hidden })],
      children: children(
        (heading !== '' || description !== '') &&
          el('div', {
            children: children(
              heading !== '' &&
                sectionHeadingMarkup({
                  className: CONTACT_HEADING,
                  level: headingLevel,
                  children: [txt(heading)],
                }),
              description !== '' &&
                el('p', { classNames: [CONTACT_DESCRIPTION], children: [txt(description)] }),
            ),
          }),
        el('form', {
          classNames: [
            cn(CONTACT_STACK, heading === '' && description === '' ? '' : CONTACT_HEADER_GAP),
          ],
          attributes: { 'data-state': literal('idle'), noValidate: literal(true) },
          children: [
            field(name, 'name', 'text', 'name', false, 1),
            field(email, 'email', 'email', 'email', false, 1),
            field(message, 'message', 'text', '', true, 5),
            honeypotMarkup(`${id}-reference`),
            ...formActionsMarkup({
              messageId: `${id}-message-region`,
              note,
              noteClassName: CONTACT_NOTE,
              submitLabel,
            }),
          ],
        }),
      ),
    })
  },
)
