import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { optionsFrom } from '../../scales'
import { DATA_FRAME_CONTROLS } from '../data.controls'
import { CELL_MAX_LENGTH, LABEL_MAX_LENGTH, SUMMARY_MAX_LENGTH } from '../data.schema'

import { progressRingMotion } from './progress-ring.motion'
import { RING_SIZES, RING_WEIGHTS, progressRingSchema } from './progress-ring.schema'

export const progressRingDefinition = defineBlock({
  id: blockId('progress-ring'),
  name: 'Progress ring',
  description: 'A circular meter that draws itself to its value and announces it once.',
  category: 'data',
  tags: ['progress', 'ring', 'meter', 'percentage', 'data'],
  icon: 'loading',

  propsSchema: progressRingSchema,
  defaults: progressRingSchema.parse({}),
  previewProps: progressRingSchema.parse({ size: 'lg', caption: '' }),

  slots: [],

  controls: [
    {
      id: 'value',
      label: 'Value',
      controls: [
        { path: 'value', kind: 'number', label: 'Value' },
        { path: 'min', kind: 'number', label: 'Minimum' },
        { path: 'max', kind: 'number', label: 'Maximum' },
      ],
    },
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'label',
          kind: 'text',
          label: 'Accessible name',
          hint: 'What the meter measures. A progressbar with no name is progress towards nothing',
          options: { maxLength: LABEL_MAX_LENGTH },
        },
        {
          path: 'valueText',
          kind: 'text',
          label: 'Announced value',
          hint: 'Empty announces "68 percent complete". Write your own when the range is a count',
          options: { maxLength: SUMMARY_MAX_LENGTH },
        },
        {
          path: 'caption',
          kind: 'text',
          label: 'Caption',
          options: { maxLength: CELL_MAX_LENGTH },
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
          options: { options: optionsFrom(RING_SIZES) },
        },
        {
          path: 'weight',
          kind: 'segmented',
          label: 'Weight',
          options: { options: optionsFrom(RING_WEIGHTS) },
        },
        { path: 'showValue', kind: 'switch', label: 'Show the figure' },
        {
          path: 'valueUnit',
          kind: 'text',
          label: 'Unit',
          hint: 'Drawn after the figure, never announced',
          options: { maxLength: 8 },
        },
        ...DATA_FRAME_CONTROLS,
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: false,
    requiresBackdrop: false,
    supportsMotion: ['entrance'],
    costClass: 'cheap',
  },

  defaultMotion: progressRingMotion,

  codegen: {
    tag: 'div',
    client: {
      kind: 'never',
      reason:
        'The arc is two circles and the fill is a CSS keyframe, so the component holds no state and calls no hook.',
    },
  },

  a11y: {
    notes: [
      'One role="progressbar" element carries aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext, and everything inside it is aria-hidden, so the value is announced once rather than twice.',
      'The accessible name is a required prop: a meter with no name tells a screen reader the progress of nothing.',
      'aria-valuetext defaults to "68 percent complete" and is overridable, because on a range that is a count the platform’s own percentage is not what the figure shows.',
      'The fill animates in CSS from a from-only keyframe over a token duration, so under reduced motion the ring shows its final value immediately rather than more slowly.',
      'A range with no width reports empty rather than full: a ring reading 100 % because its bounds were misconfigured would announce a finished task that never started.',
    ],
  },
})
