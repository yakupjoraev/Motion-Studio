import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { optionsFrom } from '../../scales'
import {
  ALT_MAX_LENGTH,
  CARD_TREATMENTS,
  LABEL_MAX_LENGTH,
  TESTIMONIAL_ATTRIBUTION_MAX_LENGTH,
  TESTIMONIAL_QUOTE_MAX_LENGTH,
} from '../marketing.schema'

import { testimonialCardMotion } from './testimonial-card.motion'
import { testimonialCardSchema } from './testimonial-card.schema'

export const testimonialCardDefinition = defineBlock({
  id: blockId('testimonial-card'),
  name: 'Testimonial card',
  description: 'A quote with a face, a role, a company and an optional logo.',
  category: 'marketing',
  tags: ['marketing', 'testimonial', 'quote', 'social proof', 'card'],
  icon: 'card',

  propsSchema: testimonialCardSchema,
  defaults: testimonialCardSchema.parse({}),
  previewProps: testimonialCardSchema.parse({
    quote: 'The export is the component I would have written by hand.',
    author: 'Priya Raman',
    role: 'Staff engineer',
    company: 'Northwind',
  }),

  slots: [],

  controls: [
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'quote',
          kind: 'textarea',
          label: 'Quote',
          options: { maxLength: TESTIMONIAL_QUOTE_MAX_LENGTH, rows: 4 },
        },
        {
          path: 'author',
          kind: 'text',
          label: 'Name',
          options: { maxLength: TESTIMONIAL_ATTRIBUTION_MAX_LENGTH },
        },
        {
          path: 'role',
          kind: 'text',
          label: 'Role',
          options: { maxLength: TESTIMONIAL_ATTRIBUTION_MAX_LENGTH },
        },
        {
          path: 'company',
          kind: 'text',
          label: 'Company',
          options: { maxLength: TESTIMONIAL_ATTRIBUTION_MAX_LENGTH },
        },
        {
          path: 'eyebrow',
          kind: 'text',
          label: 'Eyebrow',
          hint: 'Leave it empty to drop the line',
          options: { maxLength: LABEL_MAX_LENGTH },
        },
      ],
    },
    {
      id: 'media',
      label: 'Media',
      controls: [
        {
          path: 'avatar',
          kind: 'image',
          label: 'Photo',
          hint: 'Empty draws the initial instead',
        },
        { path: 'logo', kind: 'image', label: 'Company logo' },
        {
          path: 'logoAlt',
          kind: 'text',
          label: 'Logo alt text',
          hint: 'The company name, if the mark is the only place it appears',
          options: { maxLength: ALT_MAX_LENGTH },
        },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [
        {
          path: 'treatment',
          kind: 'segmented',
          label: 'Surface',
          hint: 'Glass needs a background behind it',
          options: { options: optionsFrom(CARD_TREATMENTS) },
        },
        { path: 'hidden', kind: 'switch', label: 'Hidden', responsive: true },
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: false,
    requiresBackdrop: true,
    supportsMotion: ['entrance', 'hover', 'scroll'],
    costClass: 'cheap',
    containerQuery: true,
  },

  defaultMotion: testimonialCardMotion,

  codegen: { tag: 'figure' },

  a11y: {
    notes: [
      'A <figure> holding a <blockquote> and a <figcaption>, so the attribution is announced as being about the quote rather than as part of what was said.',
      'The photo and the initial are both decorative: the name is text beside them, and describing them would say it twice.',
      'The company logo carries its own alt text, because a mark is content — a reader who cannot see it still needs to know whose words these are.',
      'The card is its own container-query scope, so the quote steps down in a narrow column without the page being narrow.',
    ],
  },
})
