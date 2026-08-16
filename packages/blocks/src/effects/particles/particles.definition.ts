import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import {
  EFFECT_A11Y_NOTES,
  effectCapabilities,
  intensityControl,
  speedControl,
  tintControl,
} from '../shared'

import { PARTICLE_COUNT, PARTICLE_SIZE, particlesSchema } from './particles.schema'

export const particlesDefinition = defineBlock({
  id: blockId('particles'),
  name: 'Particles',
  description: 'A deterministic field of points drifting upward on their own periods.',
  category: 'effects',
  tags: ['effect', 'particles', 'motion', 'field'],
  icon: 'droplet',

  propsSchema: particlesSchema,
  defaults: particlesSchema.parse({}),
  previewProps: particlesSchema.parse({ count: 40, intensity: 0.7 }),

  slots: [],

  controls: [
    {
      id: 'style',
      label: 'Style',
      controls: [
        tintControl('tint'),
        intensityControl('intensity'),
        { path: 'count', kind: 'slider', label: 'Count', options: PARTICLE_COUNT },
        { path: 'size', kind: 'slider', label: 'Size', options: PARTICLE_SIZE },
        {
          path: 'seed',
          kind: 'number',
          label: 'Seed',
          hint: 'Changes the arrangement. The same seed always places the same field',
          options: { min: 0, max: 9999, step: 1 },
        },
      ],
    },
    { id: 'motion', label: 'Motion', controls: [speedControl('speed')] },
  ],

  capabilities: effectCapabilities('heavy'),
  defaultMotion: {},
  codegen: { tag: 'div' },
  a11y: {
    notes: [
      ...EFFECT_A11Y_NOTES,
      'Loaded on demand: the palette shows a static thumbnail, so browsing never fetches it.',
      'Under reduced motion the field is still and fully visible rather than invisible, because the points fade in as part of the rise.',
    ],
  },
})
