import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { DESCRIPTION_MAX_LENGTH, HEADING_LEVELS, HEADING_MAX_LENGTH } from '../marketing.schema'

import { NEWSLETTER_FIELD_CONTROLS, NEWSLETTER_MESSAGE_CONTROLS } from './newsletter-form.controls'
import { newsletterFormMotion } from './newsletter-form.motion'
import { newsletterFormSchema } from './newsletter-form.schema'

export const newsletterFormDefinition = defineBlock({
  id: blockId('newsletter-form'),
  name: 'Newsletter form',
  description: 'An email field and a submit button, with idle, loading, success and error states.',
  category: 'marketing',
  tags: ['marketing', 'newsletter', 'form', 'email', 'subscribe'],
  icon: 'form',

  propsSchema: newsletterFormSchema,
  defaults: newsletterFormSchema.parse({}),
  previewProps: newsletterFormSchema.parse({
    heading: 'Ship notes, once a month',
    description: '',
    note: '',
  }),

  slots: [],

  controls: [
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'heading',
          kind: 'text',
          label: 'Heading',
          options: { maxLength: HEADING_MAX_LENGTH },
        },
        {
          path: 'description',
          kind: 'textarea',
          label: 'Description',
          options: { maxLength: DESCRIPTION_MAX_LENGTH, rows: 2 },
        },
        {
          path: 'headingLevel',
          kind: 'select',
          label: 'Heading level',
          options: {
            options: HEADING_LEVELS.map((level) => ({ value: level, label: `h${level}` })),
          },
        },
      ],
    },
    {
      id: 'field',
      label: 'Field',
      controls: [...NEWSLETTER_FIELD_CONTROLS],
    },
    {
      id: 'messages',
      label: 'Messages',
      controls: [
        ...NEWSLETTER_MESSAGE_CONTROLS,
        { path: 'hidden', kind: 'switch', label: 'Hidden', responsive: true },
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: false,
    requiresBackdrop: false,
    supportsMotion: ['entrance', 'scroll'],
    costClass: 'cheap',
  },

  defaultMotion: newsletterFormMotion,

  codegen: {
    tag: 'div',
    // ADR-185. The one thing this markup cannot say for itself, emitted above the component so the reader
    // of the generated file is told rather than finding out in production.
    client: {
      kind: 'always',
      reason:
        'The field holds the address, its validity and the submitted state, and the submit handler is the reader’s to supply.',
    },
    notes: [
      'The submit handler is a no-op. Replace `onSubmit` with your own call — this block deliberately ships no backend.',
    ],
  },

  a11y: {
    notes: [
      'The field has a real <label>. Hiding it keeps it in the accessibility tree, because a placeholder disappears the moment somebody types and was never a label to begin with.',
      'An invalid address sets aria-invalid on the field and points aria-describedby at the message, so the answer reaches a reader who never sees the red ring.',
      'The message is a live region — polite for success, assertive for an error — so a reader whose focus is still in the field is told what happened.',
      'The button is disabled while the submission is in flight, which is the only state where pressing it again would do harm.',
    ],
  },
})
