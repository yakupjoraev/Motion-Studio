import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { EFFECT_A11Y_NOTES, effectCapabilities, intensityControl, tintControl } from '../shared'

import { GRID_AXES, LINE_SPACING, LINE_WIDTH, gridLinesSchema } from './grid-lines.schema'

export const gridLinesDefinition = defineBlock({
  id: blockId('grid-lines'),
  name: 'Grid lines',
  description: 'A tiled rule lattice on one axis or both, faded at the edges.',
  category: 'effects',
  tags: ['effect', 'pattern', 'grid', 'lines'],
  icon: 'layout-grid',

  propsSchema: gridLinesSchema,
  defaults: gridLinesSchema.parse({}),
  previewProps: gridLinesSchema.parse({ intensity: 0.22, spacing: 32 }),

  slots: [],

  controls: [
    {
      id: 'style',
      label: 'Style',
      controls: [
        tintControl('tint'),
        intensityControl('intensity'),
        {
          path: 'axis',
          kind: 'segmented',
          label: 'Axis',
          options: { options: GRID_AXES.map((value) => ({ value, label: value })) },
        },
        { path: 'spacing', kind: 'slider', label: 'Spacing', options: LINE_SPACING },
        { path: 'lineWidth', kind: 'slider', label: 'Line width', options: LINE_WIDTH },
        { path: 'fade', kind: 'switch', label: 'Fade at edges' },
      ],
    },
  ],

  capabilities: effectCapabilities('cheap'),
  defaultMotion: {},
  codegen: { tag: 'div' },
  a11y: { notes: [...EFFECT_A11Y_NOTES, 'Static: nothing here moves at any setting.'] },
})
