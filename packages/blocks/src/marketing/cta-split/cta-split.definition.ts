import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { optionsFrom } from '../../scales'
import {
  ACTION_VARIANTS,
  DESCRIPTION_MAX_LENGTH,
  EYEBROW_MAX_LENGTH,
  HEADING_LEVELS,
  HEADING_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  MAX_ACTIONS,
} from '../marketing.schema'
import {
  NEWSLETTER_FIELD_CONTROLS,
  NEWSLETTER_MESSAGE_CONTROLS,
} from '../newsletter-form/newsletter-form.controls'

import { ctaSplitMotion } from './cta-split.motion'
import { CTA_SIDES, CTA_SPLIT_SURFACES, ctaSplitSchema } from './cta-split.schema'

export const ctaSplitDefinition = defineBlock({
  id: blockId('cta-split'),
  name: 'CTA split',
  description: 'Copy on one side, a signup form or a pair of buttons on the other.',
  category: 'marketing',
  tags: ['marketing', 'cta', 'split', 'form', 'signup'],
  icon: 'layout-columns',

  propsSchema: ctaSplitSchema,
  defaults: ctaSplitSchema.parse({}),
  previewProps: ctaSplitSchema.parse({ description: '', note: '' }),

  slots: [],

  controls: [
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'eyebrow',
          kind: 'text',
          label: 'Eyebrow',
          options: { maxLength: EYEBROW_MAX_LENGTH },
        },
        {
          path: 'heading',
          kind: 'textarea',
          label: 'Heading',
          options: { maxLength: HEADING_MAX_LENGTH, rows: 2 },
        },
        {
          path: 'description',
          kind: 'textarea',
          label: 'Description',
          options: { maxLength: DESCRIPTION_MAX_LENGTH, rows: 3 },
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
      id: 'layout',
      label: 'Layout',
      controls: [
        {
          path: 'side',
          kind: 'segmented',
          label: 'Opposite the copy',
          options: { options: optionsFrom(CTA_SIDES) },
        },
        {
          path: 'surface',
          kind: 'segmented',
          label: 'Surface',
          hint: 'Glass needs a background behind it',
          options: { options: optionsFrom(CTA_SPLIT_SURFACES) },
        },
        { path: 'hidden', kind: 'switch', label: 'Hidden', responsive: true },
      ],
    },
    {
      id: 'buttons',
      label: 'Buttons',
      controls: [
        {
          path: 'actions',
          kind: 'list',
          label: 'Buttons',
          hint: 'Shown when the side is set to buttons',
          options: {
            max: MAX_ACTIONS,
            labelKey: 'label',
            sortable: true,
            itemTemplate: { label: 'Read the docs', href: '#', variant: 'secondary' },
            itemControls: [
              {
                path: 'label',
                kind: 'text',
                label: 'Label',
                options: { maxLength: LABEL_MAX_LENGTH },
              },
              { path: 'href', kind: 'link', label: 'Link' },
              {
                path: 'variant',
                kind: 'segmented',
                label: 'Variant',
                options: { options: optionsFrom(ACTION_VARIANTS) },
              },
            ],
          },
        },
      ],
    },
    {
      id: 'field',
      label: 'Form',
      controls: [...NEWSLETTER_FIELD_CONTROLS, ...NEWSLETTER_MESSAGE_CONTROLS],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: true,
    requiresBackdrop: true,
    supportsMotion: ['entrance', 'scroll'],
    costClass: 'cheap',
  },

  defaultMotion: ctaSplitMotion,

  codegen: {
    tag: 'section',
    // ADR-185, the same note `newsletter-form` carries: this block embeds the same field.
    notes: [
      'The submit handler is a no-op. Replace `onSubmit` with your own call — this block deliberately ships no backend.',
    ],
  },

  a11y: {
    notes: [
      'The form is the same field newsletter-form ships, so the label, aria-invalid, aria-describedby and live region behave identically in both blocks.',
      'The copy comes before the form in reading order at every width, so a reader knows what they are signing up for before reaching the field.',
      'The heading level is a prop, so the block nests under whatever heading is above it.',
    ],
  },
})
