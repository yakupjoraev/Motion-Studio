import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { SPACE_SCALE, optionsFrom } from '../../scales'

import { columnsMotion } from './columns.motion'
import { COLUMN_ALIGN, SPLITS, columnsSchema } from './columns.schema'

export const columnsDefinition = defineBlock({
  id: blockId('columns'),
  name: 'Columns',
  description: 'Two columns with an asymmetric split, stacked on a phone.',
  category: 'layout',
  tags: ['layout', 'split', 'two-column'],
  icon: 'columns',

  propsSchema: columnsSchema,
  defaults: columnsSchema.parse({}),
  previewProps: columnsSchema.parse({ split: '2-1' }),

  // One child each, and named: a drop into the left column highlights the left column.
  slots: [
    { name: 'left', label: 'Left', accepts: '*', minChildren: 0, maxChildren: 1 },
    { name: 'right', label: 'Right', accepts: '*', minChildren: 0, maxChildren: 1 },
  ],

  controls: [
    {
      id: 'layout',
      label: 'Layout',
      controls: [
        {
          path: 'split',
          kind: 'select',
          label: 'Split',
          responsive: true,
          options: { options: optionsFrom(SPLITS) },
        },
        {
          path: 'gap',
          kind: 'select',
          label: 'Gap',
          responsive: true,
          options: { options: optionsFrom(SPACE_SCALE) },
        },
        {
          path: 'align',
          kind: 'segmented',
          label: 'Align',
          responsive: true,
          options: { options: optionsFrom(COLUMN_ALIGN) },
        },
        {
          path: 'reverseOnMobile',
          kind: 'switch',
          label: 'Reverse on mobile',
          hint: 'Which column reads first on a phone',
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

  defaultMotion: columnsMotion,

  codegen: { tag: 'div' },

  a11y: {
    notes: [
      'The DOM order is left then right at every width, so the reading order never depends on the layout.',
      'Reverse on mobile flips the visual order only, which is why it is a prop and not a second tree.',
    ],
  },
})
