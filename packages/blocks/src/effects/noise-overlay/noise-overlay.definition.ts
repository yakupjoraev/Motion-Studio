import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { EFFECT_A11Y_NOTES, effectCapabilities, intensityControl } from '../shared'

import { NOISE_BLENDS, NOISE_SCALE, noiseOverlaySchema } from './noise-overlay.schema'

export const noiseOverlayDefinition = defineBlock({
  id: blockId('noise-overlay'),
  name: 'Noise',
  description: 'A static grain texture blended into the surface to break up flat colour.',
  category: 'effects',
  tags: ['effect', 'texture', 'noise', 'grain'],
  icon: 'noise',

  propsSchema: noiseOverlaySchema,
  defaults: noiseOverlaySchema.parse({}),
  previewProps: noiseOverlaySchema.parse({ intensity: 0.3, scale: 120 }),

  slots: [],

  controls: [
    {
      id: 'style',
      label: 'Style',
      controls: [
        intensityControl('intensity', 'Amount'),
        { path: 'scale', kind: 'slider', label: 'Grain size', options: NOISE_SCALE },
        {
          path: 'blend',
          kind: 'select',
          label: 'Blend',
          hint: 'Overlay and soft-light keep the value underneath and disturb only local contrast',
          options: { options: NOISE_BLENDS.map((value) => ({ value, label: value })) },
        },
      ],
    },
  ],

  capabilities: effectCapabilities('cheap'),
  defaultMotion: {},
  codegen: {
    tag: 'div',
    client: {
      kind: 'never',
      reason: 'A tiled noise texture at low opacity.',
    },
  },
  a11y: {
    notes: [
      ...EFFECT_A11Y_NOTES,
      'Static by design: grain that moves is the grain-overlay effect, which declares the movement.',
    ],
  },
})
