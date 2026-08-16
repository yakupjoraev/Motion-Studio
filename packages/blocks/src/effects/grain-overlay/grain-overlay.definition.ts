import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { EFFECT_A11Y_NOTES, effectCapabilities, intensityControl, speedControl } from '../shared'

import { GRAIN_BLENDS, GRAIN_SCALE, grainOverlaySchema } from './grain-overlay.schema'

export const grainOverlayDefinition = defineBlock({
  id: blockId('grain-overlay'),
  name: 'Film grain',
  description: 'Noise that resamples in discrete steps, the way film grain does.',
  category: 'effects',
  tags: ['effect', 'texture', 'grain', 'film'],
  icon: 'opacity',

  propsSchema: grainOverlaySchema,
  defaults: grainOverlaySchema.parse({}),
  previewProps: grainOverlaySchema.parse({ intensity: 0.35, scale: 120 }),

  slots: [],

  controls: [
    {
      id: 'style',
      label: 'Style',
      controls: [
        intensityControl('intensity', 'Amount'),
        { path: 'scale', kind: 'slider', label: 'Grain size', options: GRAIN_SCALE },
        {
          path: 'blend',
          kind: 'segmented',
          label: 'Blend',
          options: { options: GRAIN_BLENDS.map((value) => ({ value, label: value })) },
        },
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
      'Eight steps over four cycles: 2.5 Hz at the fastest speed the schema allows, under the 3 Hz flashing limit.',
    ],
  },
})
