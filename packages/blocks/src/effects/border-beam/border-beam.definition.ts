import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import {
  EFFECT_A11Y_NOTES,
  effectCapabilities,
  intensityControl,
  speedControl,
  tintControl,
} from '../shared'

import { BEAM_ARC, BEAM_BORDER_WIDTH, borderBeamSchema } from './border-beam.schema'

export const borderBeamDefinition = defineBlock({
  id: blockId('border-beam'),
  name: 'Border beam',
  description: 'A lit arc travelling around the node’s own border, masked from a conic gradient.',
  category: 'effects',
  tags: ['effect', 'border', 'beam', 'outline'],
  icon: 'border',

  propsSchema: borderBeamSchema,
  defaults: borderBeamSchema.parse({}),
  previewProps: borderBeamSchema.parse({ arc: 70, borderWidth: 2 }),

  slots: [],

  controls: [
    {
      id: 'style',
      label: 'Style',
      controls: [
        tintControl('tint'),
        intensityControl('intensity'),
        { path: 'borderWidth', kind: 'slider', label: 'Border', options: BEAM_BORDER_WIDTH },
        {
          path: 'arc',
          kind: 'slider',
          label: 'Arc',
          hint: 'A short arc reads as a comet; a long one as a rotating gradient',
          options: BEAM_ARC,
        },
      ],
    },
    { id: 'motion', label: 'Motion', controls: [speedControl('speed')] },
  ],

  capabilities: effectCapabilities('cheap'),
  defaultMotion: {},
  codegen: {
    tag: 'div',
    client: {
      kind: 'never',
      reason: 'A conic gradient rotating behind a masked border.',
    },
  },
  a11y: {
    notes: [
      ...EFFECT_A11Y_NOTES,
      'Follows the node’s own radius through border-radius: inherit, so it never cuts a corner the design rounded.',
    ],
  },
})
