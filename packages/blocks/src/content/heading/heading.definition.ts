import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { ALIGNMENTS, optionsFrom } from '../../scales'

import { headingMotion } from './heading.motion'
import {
  ANCHOR_MAX_LENGTH,
  HEADING_MAX_LENGTH,
  HEADING_SIZES,
  HEADING_WEIGHTS,
  TRACKING,
  headingSchema,
} from './heading.schema'

export const headingDefinition = defineBlock({
  id: blockId('heading'),
  name: 'Heading',
  description: 'A section title, with its level and its size chosen separately.',
  category: 'content',
  tags: ['text', 'title', 'typography'],
  icon: 'type',

  propsSchema: headingSchema,
  defaults: headingSchema.parse({}),
  previewProps: headingSchema.parse({ text: 'Build interfaces that move', size: '2xl' }),

  slots: [],

  controls: [
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'text',
          kind: 'text',
          label: 'Text',
          options: { maxLength: HEADING_MAX_LENGTH },
        },
        { path: 'level', kind: 'stepper', label: 'Level', options: { min: 1, max: 6 } },
        {
          path: 'anchor',
          kind: 'text',
          label: 'Anchor',
          hint: 'A fragment id so this section can be linked to. Never generated from the text',
          options: { maxLength: ANCHOR_MAX_LENGTH },
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
          options: { options: optionsFrom(HEADING_SIZES) },
        },
        {
          path: 'weight',
          kind: 'select',
          label: 'Weight',
          options: { options: optionsFrom(HEADING_WEIGHTS) },
        },
        {
          path: 'tracking',
          kind: 'segmented',
          label: 'Tracking',
          options: { options: optionsFrom(TRACKING) },
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
      id: 'style',
      label: 'Style',
      controls: [
        {
          path: 'gradient',
          kind: 'switch',
          label: 'Gradient',
          hint: 'Paints the text with the accent ramp',
        },
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: false,
    requiresBackdrop: false,
    supportsMotion: ['entrance', 'scroll', 'hover'],
    costClass: 'cheap',
  },

  defaultMotion: headingMotion,

  codegen: { tag: 'h2' },

  a11y: {
    notes: [
      'The level is the document outline and the size is the type scale, so a visually large heading can still be an h2.',
      'Levels are the author’s to keep in order; the editor does not renumber them behind their back.',
      'Gradient text keeps its own colour token as the fallback, so a browser without background-clip still reads it.',
      'The anchor is the author’s to set and is never generated from the text: an id derived from wording breaks every link to it the moment a word changes.',
    ],
  },
})
