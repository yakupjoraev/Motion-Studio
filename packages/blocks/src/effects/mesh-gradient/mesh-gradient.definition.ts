import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import {
  EFFECT_A11Y_NOTES,
  effectCapabilities,
  intensityControl,
  speedControl,
  tintControl,
} from '../shared'

import { MESH_BLUR, MESH_SPREAD, meshGradientSchema } from './mesh-gradient.schema'

export const meshGradientDefinition = defineBlock({
  id: blockId('mesh-gradient'),
  name: 'Mesh gradient',
  description: 'Three hues kneaded across one surface by an animated background position.',
  category: 'effects',
  tags: ['effect', 'background', 'gradient', 'mesh'],
  icon: 'gradient',

  propsSchema: meshGradientSchema,
  defaults: meshGradientSchema.parse({}),
  previewProps: meshGradientSchema.parse({ intensity: 0.75, spread: 65 }),

  slots: [],

  controls: [
    {
      id: 'style',
      label: 'Style',
      controls: [
        tintControl('tint'),
        { ...tintControl('secondaryTint'), label: 'Second tint' },
        { ...tintControl('tertiaryTint'), label: 'Third tint' },
        intensityControl('intensity'),
        { path: 'spread', kind: 'slider', label: 'Spread', options: MESH_SPREAD },
        { path: 'blur', kind: 'slider', label: 'Blur', options: MESH_BLUR },
        {
          path: 'scrim',
          kind: 'switch',
          label: 'Scrim',
          hint: 'Keeps text in front of the mesh legible. Off only for a band with no copy on it',
        },
      ],
    },
    { id: 'motion', label: 'Motion', controls: [speedControl('speed')] },
  ],

  capabilities: effectCapabilities('heavy'),
  defaultMotion: {},
  codegen: {
    tag: 'div',
    client: {
      kind: 'never',
      reason: 'Four gradients drifting on their own keyframes.',
    },
  },
  a11y: {
    notes: [
      ...EFFECT_A11Y_NOTES,
      'Loaded on demand: the palette shows a static thumbnail, so browsing the catalogue never fetches it.',
    ],
  },
})
