import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { ALIGNMENTS, optionsFrom } from '../../scales'

import { quoteMotion } from './quote.motion'
import {
  ATTRIBUTION_MAX_LENGTH,
  QUOTE_MARKS,
  QUOTE_MAX_LENGTH,
  QUOTE_SIZES,
  quoteSchema,
} from './quote.schema'

export const quoteDefinition = defineBlock({
  id: blockId('quote'),
  name: 'Quote',
  description: 'A pull quote with an attribution and an optional avatar.',
  category: 'content',
  tags: ['quote', 'blockquote', 'testimonial'],
  icon: 'type',

  propsSchema: quoteSchema,
  defaults: quoteSchema.parse({}),
  previewProps: quoteSchema.parse({ mark: 'glyph', size: 'xl' }),

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
          options: { maxLength: QUOTE_MAX_LENGTH, rows: 4 },
        },
        {
          path: 'author',
          kind: 'text',
          label: 'Author',
          options: { maxLength: ATTRIBUTION_MAX_LENGTH },
        },
        {
          path: 'role',
          kind: 'text',
          label: 'Role',
          options: { maxLength: ATTRIBUTION_MAX_LENGTH },
        },
        {
          path: 'avatar',
          kind: 'image',
          label: 'Avatar',
          hint: 'Empty draws the author’s initial rather than an empty circle',
        },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [
        {
          path: 'size',
          kind: 'segmented',
          label: 'Size',
          responsive: true,
          options: { options: optionsFrom(QUOTE_SIZES) },
        },
        {
          path: 'mark',
          kind: 'select',
          label: 'Quotation mark',
          options: { options: optionsFrom(QUOTE_MARKS) },
        },
        {
          path: 'align',
          kind: 'segmented',
          label: 'Align',
          responsive: true,
          options: { options: optionsFrom(ALIGNMENTS) },
        },
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

  defaultMotion: quoteMotion,

  codegen: { tag: 'figure' },

  a11y: {
    notes: [
      'A figure wrapping a blockquote and a figcaption: the attribution is about the quote rather than part of it, so it is never read as something the person said.',
      'The avatar is decorative — the name is already text beside it — so its alt is empty rather than a duplicate of the name.',
      'The large quotation glyph is aria-hidden; a screen reader announcing a punctuation mark is noise.',
    ],
  },
})
