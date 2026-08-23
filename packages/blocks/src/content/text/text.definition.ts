import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { ALIGNMENTS, optionsFrom } from '../../scales'

import { textMotion } from './text.motion'
import { MEASURES, TEXT_MAX_LENGTH, TEXT_SIZES, TEXT_TONES, textSchema } from './text.schema'

export const textDefinition = defineBlock({
  id: blockId('text'),
  name: 'Text',
  description: 'A paragraph, with its measure kept inside the readable range.',
  category: 'content',
  tags: ['text', 'paragraph', 'body', 'typography'],
  icon: 'type',

  propsSchema: textSchema,
  defaults: textSchema.parse({}),
  previewProps: textSchema.parse({ size: 'lg', tone: 'default' }),

  slots: [],

  controls: [
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'text',
          kind: 'textarea',
          label: 'Text',
          options: { maxLength: TEXT_MAX_LENGTH, rows: 5 },
        },
      ],
    },
    {
      id: 'typography',
      label: 'Typography',
      controls: [
        {
          path: 'size',
          kind: 'select',
          label: 'Size',
          responsive: true,
          options: { options: optionsFrom(TEXT_SIZES) },
        },
        {
          path: 'tone',
          kind: 'segmented',
          label: 'Tone',
          options: { options: optionsFrom(TEXT_TONES) },
        },
        {
          path: 'measure',
          kind: 'select',
          label: 'Measure',
          hint: '60–75 characters is the readable range; full width is a deliberate choice',
          responsive: true,
          options: { options: optionsFrom(MEASURES) },
        },
        {
          path: 'align',
          kind: 'segmented',
          label: 'Align',
          responsive: true,
          options: { options: optionsFrom(ALIGNMENTS) },
        },
        {
          path: 'balance',
          kind: 'switch',
          label: 'Balance',
          hint: 'Evens the last line instead of leaving one word on it',
        },
      ],
    },
    {
      id: 'layout',
      label: 'Layout',
      controls: [
        {
          path: 'columns',
          kind: 'stepper',
          label: 'Columns',
          responsive: true,
          hint: 'Collapses to one column below the medium breakpoint',
          options: { min: 1, max: 3 },
        },
        {
          path: 'dropCap',
          kind: 'switch',
          label: 'Drop cap',
          hint: 'Styles the first letter; it stays one character of text',
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

  defaultMotion: textMotion,

  codegen: {
    tag: 'p',
    client: {
      kind: 'never',
      reason: 'A paragraph. The measure, the leading and the balance are classes.',
    },
  },

  a11y: {
    notes: [
      'The drop cap is ::first-letter, so the letter stays part of the sentence a screen reader reads and part of what a user copies.',
      'The measure is capped in characters rather than pixels, so it holds at any root font size a reader has chosen.',
      'Multi-column collapses to one column below the medium breakpoint: a column of four words is not a column.',
    ],
  },
})
