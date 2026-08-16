import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import {
  EFFECT_A11Y_NOTES,
  effectCapabilities,
  intensityControl,
  speedControl,
  tintControl,
} from '../shared'

import { AURORA_BLUR, auroraBackgroundSchema } from './aurora-background.schema'

export const auroraBackgroundDefinition = defineBlock({
  id: blockId('aurora-background'),
  name: 'Aurora',
  description: 'Two-hue blurred fields drifting on unrelated periods behind the content.',
  category: 'effects',
  tags: ['effect', 'background', 'gradient', 'aurora'],
  icon: 'wave',

  propsSchema: auroraBackgroundSchema,
  defaults: auroraBackgroundSchema.parse({}),
  previewProps: auroraBackgroundSchema.parse({ intensity: 0.6, blur: 64 }),

  slots: [],

  controls: [
    {
      id: 'style',
      label: 'Style',
      controls: [
        tintControl('tint'),
        { ...tintControl('secondaryTint'), label: 'Second tint' },
        intensityControl('intensity'),
        { path: 'blur', kind: 'slider', label: 'Blur', options: AURORA_BLUR },
        {
          path: 'grain',
          kind: 'switch',
          label: 'Grain',
          hint: 'Hides the banding a wide gradient shows on an 8-bit display',
        },
        {
          path: 'scrim',
          kind: 'switch',
          label: 'Scrim',
          hint: 'Keeps text in front of the aurora legible. Off only for a band with no copy on it',
        },
      ],
    },
    { id: 'motion', label: 'Motion', controls: [speedControl('speed')] },
  ],

  capabilities: effectCapabilities('moderate'),
  defaultMotion: {},
  codegen: { tag: 'div' },
  a11y: { notes: EFFECT_A11Y_NOTES },
})
