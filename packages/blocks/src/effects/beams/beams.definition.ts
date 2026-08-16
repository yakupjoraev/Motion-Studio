import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import {
  EFFECT_A11Y_NOTES,
  effectCapabilities,
  intensityControl,
  speedControl,
  tintControl,
} from '../shared'

import { BEAM_ANGLE, BEAM_COUNT, BEAM_WIDTH, beamsSchema } from './beams.schema'

export const beamsDefinition = defineBlock({
  id: blockId('beams'),
  name: 'Beams',
  description: 'Tilted bands of light sweeping across the surface on staggered cycles.',
  category: 'effects',
  tags: ['effect', 'light', 'beams', 'sweep'],
  icon: 'zap',

  propsSchema: beamsSchema,
  defaults: beamsSchema.parse({}),
  previewProps: beamsSchema.parse({ intensity: 0.55, count: 4 }),

  slots: [],

  controls: [
    {
      id: 'style',
      label: 'Style',
      controls: [
        tintControl('tint'),
        intensityControl('intensity'),
        { path: 'count', kind: 'stepper', label: 'Beams', options: BEAM_COUNT },
        { path: 'width', kind: 'slider', label: 'Width', options: BEAM_WIDTH },
        { path: 'angle', kind: 'slider', label: 'Angle', options: BEAM_ANGLE },
      ],
    },
    { id: 'motion', label: 'Motion', controls: [speedControl('speed')] },
  ],

  capabilities: effectCapabilities('moderate'),
  defaultMotion: {},
  codegen: { tag: 'div' },
  a11y: {
    notes: [
      ...EFFECT_A11Y_NOTES,
      'Only transform animates, so the sweep runs on the compositor rather than repainting the section.',
    ],
  },
})
