import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { ALIGNMENTS, optionsFrom } from '../../scales'

import { statMotion } from './stat.motion'
import {
  DELTA_DIRECTIONS,
  LABEL_MAX_LENGTH,
  MAX_SERIES_POINTS,
  STAT_SIZES,
  VALUE_MAX_LENGTH,
  statSchema,
} from './stat.schema'

export const statDefinition = defineBlock({
  id: blockId('stat'),
  name: 'Stat',
  description: 'A figure, its label, an optional change and an inline sparkline.',
  category: 'content',
  tags: ['stat', 'metric', 'number', 'sparkline'],
  icon: 'timeline',

  propsSchema: statSchema,
  defaults: statSchema.parse({}),
  previewProps: statSchema.parse({
    value: '4.9×',
    label: 'Faster than hand-writing it',
    delta: '+12%',
    deltaDirection: 'up-is-good',
    deltaRose: true,
    series: [2, 3, 3, 4, 6, 5, 7, 8, 9, 9],
  }),

  slots: [],

  controls: [
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'value',
          kind: 'text',
          label: 'Value',
          hint: 'Free text, so a unit, a multiple or a currency all fit',
          options: { maxLength: VALUE_MAX_LENGTH },
        },
        {
          path: 'label',
          kind: 'text',
          label: 'Label',
          options: { maxLength: LABEL_MAX_LENGTH },
        },
        {
          path: 'delta',
          kind: 'text',
          label: 'Change',
          hint: 'Empty hides the row',
          options: { maxLength: VALUE_MAX_LENGTH },
        },
        { path: 'deltaRose', kind: 'switch', label: 'Change went up' },
        {
          path: 'deltaDirection',
          kind: 'select',
          label: 'Which way is good',
          hint: 'A falling error rate is an improvement; the block cannot guess that',
          options: { options: optionsFrom(DELTA_DIRECTIONS) },
        },
      ],
    },
    {
      id: 'sparkline',
      label: 'Sparkline',
      controls: [
        { path: 'showSparkline', kind: 'switch', label: 'Show sparkline' },
        {
          path: 'series',
          kind: 'list',
          label: 'Series',
          hint: 'Two points or more; fewer draws nothing',
          options: { max: MAX_SERIES_POINTS },
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
          options: { options: optionsFrom(STAT_SIZES) },
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

  defaultMotion: statMotion,

  codegen: { tag: 'div' },

  a11y: {
    notes: [
      'The sparkline is aria-hidden and carries no numbers of its own: everything it shows is already the value and the change beside it.',
      'The change carries an arrow as well as a colour, so its direction survives a colour-blind reader and a greyscale print.',
      'Values and the change use tabular numerals, so a row of statistics lines up and can be compared.',
    ],
  },
})
