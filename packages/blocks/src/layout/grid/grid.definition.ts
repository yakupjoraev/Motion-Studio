import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { SPACE_SCALE, optionsFrom } from '../../scales'

import { gridMotion } from './grid.motion'
import { GRID_MODES, MAX_COLUMNS, MIN_ITEM_WIDTHS, gridSchema } from './grid.schema'

export const gridDefinition = defineBlock({
  id: blockId('grid'),
  name: 'Grid',
  description: 'Explicit columns, or auto-fit columns that wrap at a minimum width.',
  category: 'layout',
  tags: ['layout', 'grid', 'cards'],
  icon: 'grid',

  propsSchema: gridSchema,
  defaults: gridSchema.parse({}),
  previewProps: gridSchema.parse({ mode: 'auto-fit', gapX: 'lg', gapY: 'lg' }),

  slots: [
    {
      name: 'children',
      label: 'Items',
      accepts: '*',
      minChildren: 0,
      maxChildren: null,
      orientation: () => 'grid',
    },
  ],

  controls: [
    {
      id: 'layout',
      label: 'Layout',
      controls: [
        {
          path: 'mode',
          kind: 'segmented',
          label: 'Mode',
          options: { options: optionsFrom(GRID_MODES) },
        },
        {
          path: 'columns',
          kind: 'stepper',
          label: 'Columns',
          responsive: true,
          options: { min: 1, max: MAX_COLUMNS },
        },
        {
          path: 'minItemWidth',
          kind: 'select',
          label: 'Min item width',
          hint: 'Auto-fit only',
          responsive: true,
          options: { options: optionsFrom(MIN_ITEM_WIDTHS) },
        },
        {
          path: 'gapX',
          kind: 'select',
          label: 'Gap X',
          responsive: true,
          options: { options: optionsFrom(SPACE_SCALE) },
        },
        {
          path: 'gapY',
          kind: 'select',
          label: 'Gap Y',
          responsive: true,
          options: { options: optionsFrom(SPACE_SCALE) },
        },
        { path: 'hidden', kind: 'switch', label: 'Hidden', responsive: true },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [
        {
          path: 'dense',
          kind: 'switch',
          label: 'Dense',
          hint: 'Lets a short item fill a gap above it',
        },
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: false,
    requiresBackdrop: false,
    supportsMotion: ['entrance', 'scroll'],
    costClass: 'cheap',
  },

  defaultMotion: gridMotion,

  codegen: { tag: 'div' },

  a11y: {
    notes: [
      'A plain <div>: a layout grid is not a data table, and `role="grid"` would promise keyboard cell navigation.',
      'Dense packing changes the visual order and not the DOM order, so the reading order still follows the document.',
    ],
  },
})
