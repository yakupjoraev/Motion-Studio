import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import {
  EFFECT_A11Y_NOTES,
  effectCapabilities,
  intensityControl,
  speedControl,
  tintControl,
} from '../shared'

import { SCANLINE_SPACING, SCANLINE_WIDTH, scanlinesSchema } from './scanlines.schema'

export const scanlinesDefinition = defineBlock({
  id: blockId('scanlines'),
  name: 'Scanlines',
  description:
    'Fine horizontal rules across the surface, optionally drifting one period at a time.',
  category: 'effects',
  tags: ['effect', 'pattern', 'crt', 'scanlines'],
  icon: 'layout-rows',

  propsSchema: scanlinesSchema,
  defaults: scanlinesSchema.parse({}),
  previewProps: scanlinesSchema.parse({ intensity: 0.2, spacing: 3 }),

  slots: [],

  controls: [
    {
      id: 'style',
      label: 'Style',
      controls: [
        tintControl('tint'),
        intensityControl('intensity'),
        { path: 'spacing', kind: 'slider', label: 'Spacing', options: SCANLINE_SPACING },
        { path: 'lineWidth', kind: 'slider', label: 'Line width', options: SCANLINE_WIDTH },
      ],
    },
    {
      id: 'motion',
      label: 'Motion',
      controls: [
        {
          path: 'drift',
          kind: 'switch',
          label: 'Drift',
          hint: 'Off by default: a fine pattern in motion is the likeliest thing here to bother someone',
        },
        speedControl('speed'),
      ],
    },
  ],

  capabilities: effectCapabilities('cheap'),
  defaultMotion: {},
  codegen: {
    tag: 'div',
    client: {
      kind: 'never',
      reason: 'A repeating linear gradient, drifting on a keyframe when asked to.',
    },
  },
  a11y: {
    notes: [
      ...EFFECT_A11Y_NOTES,
      'Drift is opt-in, and the drift travels exactly one period so the loop has no visible wrap.',
    ],
  },
})
