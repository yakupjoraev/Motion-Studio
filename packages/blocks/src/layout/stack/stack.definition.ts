import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { SPACE_SCALE, optionsFrom } from '../../scales'

import { stackMotion } from './stack.motion'
import { STACK_ALIGN, STACK_DIRECTIONS, STACK_JUSTIFY, stackSchema } from './stack.schema'

export const stackDefinition = defineBlock({
  id: blockId('stack'),
  name: 'Stack',
  description: 'A line of blocks with a gap, and optionally a rule between them.',
  category: 'layout',
  tags: ['layout', 'flex', 'list'],
  icon: 'rows',

  propsSchema: stackSchema,
  defaults: stackSchema.parse({}),
  previewProps: stackSchema.parse({ gap: 'lg', divider: true }),

  slots: [{ name: 'children', label: 'Content', accepts: '*', minChildren: 0, maxChildren: null }],

  controls: [
    {
      id: 'layout',
      label: 'Layout',
      controls: [
        {
          path: 'direction',
          kind: 'segmented',
          label: 'Direction',
          responsive: true,
          options: { options: optionsFrom(STACK_DIRECTIONS) },
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
          options: { options: optionsFrom(STACK_ALIGN) },
        },
        {
          path: 'justify',
          kind: 'segmented',
          label: 'Justify',
          responsive: true,
          options: { options: optionsFrom(STACK_JUSTIFY) },
        },
        { path: 'hidden', kind: 'switch', label: 'Hidden', responsive: true },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [
        { path: 'divider', kind: 'switch', label: 'Divider', hint: 'A rule between the items' },
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

  defaultMotion: stackMotion,

  codegen: { tag: 'div' },

  a11y: {
    notes: [
      'A plain <div>: a stack is layout, and a list of links belongs in a <nav> instead.',
      'The divider is a border rather than an element, so a screen reader reads the items and not the rules.',
    ],
  },
})
