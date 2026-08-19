import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { FORMS_FRAME_CONTROLS } from '../forms.controls'
import {
  ERROR_MAX_LENGTH,
  FIELD_LABEL_MAX_LENGTH,
  HINT_MAX_LENGTH,
  MESSAGE_MAX_LENGTH,
  PLACEHOLDER_MAX_LENGTH,
} from '../forms.schema'

import { waitlistFormMotion } from './waitlist-form.motion'
import { waitlistFormSchema } from './waitlist-form.schema'

export const waitlistFormDefinition = defineBlock({
  id: blockId('waitlist-form'),
  name: 'Waitlist form',
  description: 'One email field and a button, compact, with the success message in its place.',
  category: 'forms',
  tags: ['form', 'waitlist', 'email', 'signup', 'submit'],
  icon: 'form',

  propsSchema: waitlistFormSchema,
  defaults: waitlistFormSchema.parse({}),
  previewProps: waitlistFormSchema.parse({ showLabel: true }),

  slots: [],

  controls: [
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'label',
          kind: 'text',
          label: 'Label',
          hint: 'Always in the markup. The switch below only decides whether it is drawn',
          options: { maxLength: FIELD_LABEL_MAX_LENGTH },
        },
        { path: 'showLabel', kind: 'switch', label: 'Show the label' },
        {
          path: 'hint',
          kind: 'text',
          label: 'Hint',
          options: { maxLength: HINT_MAX_LENGTH },
        },
        {
          path: 'placeholder',
          kind: 'text',
          label: 'Placeholder',
          options: { maxLength: PLACEHOLDER_MAX_LENGTH },
        },
        {
          path: 'note',
          kind: 'text',
          label: 'Note',
          hint: 'Small print under the row — a consent line, a link to a policy',
          options: { maxLength: MESSAGE_MAX_LENGTH },
        },
      ],
    },
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
          label: 'While joining',
          options: { maxLength: FIELD_LABEL_MAX_LENGTH },
        },
      ],
    },
    {
      id: 'outcome',
      label: 'Outcome',
      controls: [
        {
          path: 'invalidMessage',
          kind: 'text',
          label: 'Invalid address',
          hint: 'Say what to do — “Enter a valid email address”, not “Invalid input”',
          options: { maxLength: ERROR_MAX_LENGTH },
        },
        {
          path: 'successTitle',
          kind: 'text',
          label: 'Success title',
          hint: 'Replaces the row, and takes focus so a screen reader knows it worked',
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
          hint: 'When the handler itself failed. Not the reader’s fault, so not the field’s error',
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
    costClass: 'cheap',
  },

  defaultMotion: waitlistFormMotion,

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
        'React Hook Form holds the value, the error and the submit state, and useId makes the ids.',
    },
    notes: [
      'onSubmit is a prop and its default does nothing. Replace it with your own handler — this block deliberately has no backend.',
      'The honeypot field named "reference" must stay in the markup and stay off-screen. Hiding it with display:none stops it catching anything.',
    ],
  },

  a11y: {
    notes: [
      'Compact means the label is visually hidden, not absent: a placeholder disappears as the reader types, so a form labelled only by one is a form they cannot check.',
      'The field is wired exactly as the standalone field block is — aria-describedby, aria-invalid only when invalid, aria-required, and an error in a role="alert" that is in the DOM before it has text.',
      'A failed submit moves focus to the field, which is React Hook Form’s own behaviour reached through the registration ref.',
      'On success the row is replaced by a panel that takes focus and carries role="status", because the field the reader was in has just left the document.',
      'A handler that failed is announced through the form’s own live region rather than the field’s error: it is not the reader’s fault and their address is not wrong.',
      'The honeypot is off-screen rather than display:none, aria-hidden, and out of the tab order, so it catches bots without ever being offered to a person.',
    ],
  },
})
