import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { optionsFrom } from '../../scales'

import { spacerMotion } from './spacer.motion'
import { SPACER_HEIGHTS, SPACER_MODES, spacerSchema } from './spacer.schema'

export const spacerDefinition = defineBlock({
  id: blockId('spacer'),
  name: 'Spacer',
  description: 'Vertical space, fixed or filling what is left.',
  category: 'layout',
  tags: ['layout', 'space', 'gap'],
  icon: 'move-vertical',

  propsSchema: spacerSchema,
  defaults: spacerSchema.parse({}),
  previewProps: spacerSchema.parse({ height: 'xl' }),

  slots: [],

  controls: [
    {
      id: 'layout',
      label: 'Layout',
      controls: [
        {
          path: 'mode',
          kind: 'segmented',
          label: 'Mode',
          // ADR-115: the requirement is on the block, and this is where the user reads it.
          hint: 'Fluid needs a flex parent',
          options: { options: optionsFrom(SPACER_MODES) },
        },
        {
          path: 'height',
          kind: 'select',
          label: 'Height',
          responsive: true,
          options: { options: optionsFrom(SPACER_HEIGHTS) },
        },
        { path: 'hidden', kind: 'switch', label: 'Hidden', responsive: true },
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: false,
    requiresBackdrop: false,
    supportsMotion: [],
    costClass: 'cheap',
    requiresFlexParent: true,
  },

  defaultMotion: spacerMotion,

  codegen: {
    tag: 'div',
    client: {
      kind: 'never',
      reason: 'A div with a height on it. There is nothing else in the component.',
    },
  },

  a11y: {
    notes: [
      'aria-hidden: a spacer carries no content, and announcing it would be reading the layout aloud.',
      'Never used to separate meaning — that is a divider, which has a role.',
    ],
  },
})
