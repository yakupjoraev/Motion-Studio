import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import type { TypedControlGroup } from '../../define-block.types'
import { HEADING_LEVELS } from '../../marketing/marketing.schema'
import { FORMS_FRAME_CONTROLS } from '../forms.controls'
import {
  ERROR_MAX_LENGTH,
  FIELD_LABEL_MAX_LENGTH,
  HINT_MAX_LENGTH,
  MESSAGE_MAX_LENGTH,
  PLACEHOLDER_MAX_LENGTH,
} from '../forms.schema'

import { contactFormMotion } from './contact-form.motion'
import { type ContactFormShape, contactFormSchema } from './contact-form.schema'

/**
 * The four controls a field's words need, for each of the three fields.
 *
 * The return type is annotated rather than inferred, and that is what keeps the paths checked: a template string
 * widens to `string` on its own, and only a contextual type of literal paths narrows `${id}.label` back to the
 * three it can be. ADR-110 through the compiler, for a group built by a function.
 */
const fieldGroup = (
  id: 'name' | 'email' | 'message',
  label: string,
): TypedControlGroup<ContactFormShape> => ({
  id,
  label,
  controls: [
    {
      path: `${id}.label`,
      kind: 'text',
      label: 'Label',
      options: { maxLength: FIELD_LABEL_MAX_LENGTH },
    },
    {
      path: `${id}.hint`,
      kind: 'text',
      label: 'Hint',
      options: { maxLength: HINT_MAX_LENGTH },
    },
    {
      path: `${id}.placeholder`,
      kind: 'text',
      label: 'Placeholder',
      options: { maxLength: PLACEHOLDER_MAX_LENGTH },
    },
    {
      path: `${id}.error`,
      kind: 'text',
      label: 'Error',
      hint: 'Say what to do — “Enter a valid email address”, not “Invalid input”',
      options: { maxLength: ERROR_MAX_LENGTH },
    },
  ],
})

export const contactFormDefinition = defineBlock({
  id: blockId('contact-form'),
  name: 'Contact form',
  description: 'Name, email and message, validated, announced, and wired to your own handler.',
  category: 'forms',
  tags: ['form', 'contact', 'message', 'validation', 'submit'],
  icon: 'form',

  propsSchema: contactFormSchema,
  defaults: contactFormSchema.parse({}),
  previewProps: contactFormSchema.parse({ description: '' }),

  slots: [],

  controls: [
    {
      id: 'copy',
      label: 'Copy',
      controls: [
        {
          path: 'heading',
          kind: 'text',
          label: 'Heading',
          options: { maxLength: FIELD_LABEL_MAX_LENGTH },
        },
        {
          path: 'description',
          kind: 'textarea',
          label: 'Description',
          options: { rows: 2, maxLength: MESSAGE_MAX_LENGTH },
        },
        {
          path: 'headingLevel',
          kind: 'select',
          label: 'Heading level',
          hint: 'One step below the heading above it, or the page skips a level',
          options: {
            options: HEADING_LEVELS.map((level) => ({ value: level, label: `h${level}` })),
          },
        },
      ],
    },
    fieldGroup('name', 'Name field'),
    fieldGroup('email', 'Email field'),
    fieldGroup('message', 'Message field'),
    {
      id: 'submit',
      label: 'Submit',
      controls: [
        {
          path: 'submitLabel',
          kind: 'text',
          label: 'Button',
          options: { maxLength: FIELD_LABEL_MAX_LENGTH },
        },
        {
          path: 'submittingLabel',
          kind: 'text',
          label: 'While sending',
          options: { maxLength: FIELD_LABEL_MAX_LENGTH },
        },
        {
          path: 'note',
          kind: 'text',
          label: 'Note',
          hint: 'Small print beside the button — a consent line, a link to a policy',
          options: { maxLength: MESSAGE_MAX_LENGTH },
        },
      ],
    },
    {
      id: 'outcome',
      label: 'Outcome',
      controls: [
        {
          path: 'successTitle',
          kind: 'text',
          label: 'Success title',
          hint: 'Replaces the form, and takes focus so a screen reader knows it worked',
          options: { maxLength: FIELD_LABEL_MAX_LENGTH },
        },
        {
          path: 'successBody',
          kind: 'textarea',
          label: 'Success body',
          options: { rows: 2, maxLength: MESSAGE_MAX_LENGTH },
        },
        {
          path: 'failureMessage',
          kind: 'text',
          label: 'Failure message',
          hint: 'When the handler itself failed. Not the reader’s fault, so not a field’s error',
          options: { maxLength: MESSAGE_MAX_LENGTH },
        },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [...FORMS_FRAME_CONTROLS],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: false,
    requiresBackdrop: false,
    supportsMotion: ['entrance'],
    costClass: 'moderate',
  },

  defaultMotion: contactFormMotion,

  codegen: {
    tag: 'div',
    dependencies: {
      '@hookform/resolvers': '^3.10.0',
      'react-hook-form': '^7.85.0',
      zod: '^3.23.8',
    },
    imports: [
      { from: '@hookform/resolvers/zod', named: ['zodResolver'] },
      { from: 'react-hook-form', named: ['useForm'] },
      { from: 'zod', named: ['z'] },
    ],
    client: {
      kind: 'always',
      reason:
        'React Hook Form holds the values, the errors and the submit state, and useId makes the ids.',
    },
    notes: [
      'onSubmit is a prop and its default does nothing. Replace it with your own handler — this block deliberately has no backend.',
      'The honeypot field named "reference" must stay in the markup and stay off-screen. Hiding it with display:none stops it catching anything.',
    ],
  },

  a11y: {
    notes: [
      'Every field is wired the way the standalone field block is — label, aria-describedby, aria-invalid only when invalid, aria-required, and an error in a role="alert" that is in the DOM before it has text.',
      'A failed submit moves focus to the first invalid field, which is React Hook Form’s own behaviour reached through each field’s registration ref.',
      'On success the form is replaced by a panel that takes focus and carries role="status", because the form the reader was in has just left the document.',
      'A handler that failed is announced through a form-level live region rather than a field’s error: it is not the reader’s fault and no field of theirs is wrong.',
      'Only the submit button is disabled while the form is sending — disabling the field the reader is in would take focus out from under them.',
      'The honeypot is off-screen rather than display:none, aria-hidden, and out of the tab order, so it catches bots without ever being offered to a person.',
      'Native validation is off, so the browser’s own bubble never competes with the messages the block controls.',
    ],
  },
})
