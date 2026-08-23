import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { EFFECT_A11Y_NOTES, effectCapabilities, intensityControl, tintControl } from '../shared'

import { DOT_SIZE, DOT_SPACING, dotGridSchema } from './dot-grid.schema'

export const dotGridDefinition = defineBlock({
  id: blockId('dot-grid'),
  name: 'Dot grid',
  description: 'A tiled dot lattice, faded at the edges, as surface texture.',
  category: 'effects',
  tags: ['effect', 'pattern', 'grid', 'dots'],
  icon: 'grid',

  propsSchema: dotGridSchema,
  defaults: dotGridSchema.parse({}),
  previewProps: dotGridSchema.parse({ intensity: 0.28, spacing: 18 }),

  slots: [],

  controls: [
    {
      id: 'style',
      label: 'Style',
      controls: [
        tintControl('tint'),
        intensityControl('intensity'),
        { path: 'spacing', kind: 'slider', label: 'Spacing', options: DOT_SPACING },
        { path: 'dotSize', kind: 'slider', label: 'Dot size', options: DOT_SIZE },
        {
          path: 'fade',
          kind: 'switch',
          label: 'Fade at edges',
          hint: 'Off makes it graph paper, which is occasionally what you want',
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
      reason: 'A repeating radial gradient with a mask over it.',
    },
  },
  a11y: { notes: [...EFFECT_A11Y_NOTES, 'Static: nothing here moves at any setting.'] },
})
