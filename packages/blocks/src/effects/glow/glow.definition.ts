import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import {
  EFFECT_A11Y_NOTES,
  effectCapabilities,
  intensityControl,
  speedControl,
  tintControl,
} from '../shared'

import { GLOW_BLUR, GLOW_ORIGINS, glowSchema } from './glow.schema'

export const glowDefinition = defineBlock({
  id: blockId('glow'),
  name: 'Glow',
  description: 'A soft field of light bloomed from one edge, optionally breathing.',
  category: 'effects',
  tags: ['effect', 'light', 'glow', 'bloom'],
  icon: 'blur',

  propsSchema: glowSchema,
  defaults: glowSchema.parse({}),
  previewProps: glowSchema.parse({ intensity: 0.6, origin: 'top' }),

  slots: [],

  controls: [
    {
      id: 'style',
      label: 'Style',
      controls: [
        tintControl('tint'),
        intensityControl('intensity'),
        { path: 'blur', kind: 'slider', label: 'Blur', options: GLOW_BLUR },
        {
          path: 'origin',
          kind: 'select',
          label: 'Origin',
          options: { options: GLOW_ORIGINS.map((value) => ({ value, label: value })) },
        },
      ],
    },
    {
      id: 'motion',
      label: 'Motion',
      controls: [
        {
          path: 'breathe',
          kind: 'switch',
          label: 'Breathe',
          hint: 'A slow swell in opacity and scale — off by default, because a pulsing section holds the eye',
        },
        speedControl('speed'),
      ],
    },
  ],

  capabilities: effectCapabilities('cheap'),
  defaultMotion: {},
  codegen: { tag: 'div' },
  a11y: { notes: EFFECT_A11Y_NOTES },
})
