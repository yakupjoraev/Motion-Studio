import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import {
  EFFECT_A11Y_NOTES,
  effectCapabilities,
  intensityControl,
  speedControl,
  tintControl,
} from '../shared'

import { SHINE_ANGLE, SHINE_WIDTH, shineSchema } from './shine.schema'

export const shineDefinition = defineBlock({
  id: blockId('shine'),
  name: 'Shine',
  description: 'A tilted highlight that crosses the surface and then waits.',
  category: 'effects',
  tags: ['effect', 'light', 'shine', 'sheen'],
  icon: 'sparkles',

  propsSchema: shineSchema,
  defaults: shineSchema.parse({}),
  previewProps: shineSchema.parse({ intensity: 0.45, width: 55 }),

  slots: [],

  controls: [
    {
      id: 'style',
      label: 'Style',
      controls: [
        tintControl('tint'),
        intensityControl('intensity'),
        { path: 'width', kind: 'slider', label: 'Width', options: SHINE_WIDTH },
        { path: 'angle', kind: 'slider', label: 'Tilt', options: SHINE_ANGLE },
      ],
    },
    { id: 'motion', label: 'Motion', controls: [speedControl('speed')] },
  ],

  capabilities: effectCapabilities('cheap'),
  defaultMotion: {},
  codegen: { tag: 'div' },
  a11y: {
    notes: [
      ...EFFECT_A11Y_NOTES,
      'The pause between passes is four fifths of the cycle, so it never reads as a loading state.',
    ],
  },
})
