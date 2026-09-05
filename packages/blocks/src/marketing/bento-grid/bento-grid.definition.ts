import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { NARROW_LAYOUTS, optionsFrom } from '../../scales'
import { SECTION_FRAME_CONTROLS, sectionCopyGroup } from '../marketing.controls'

import { bentoGridMotion } from './bento-grid.motion'
import {
  CELL_HEIGHTS,
  MAX_CELLS,
  MAX_COL_SPAN,
  MAX_ROW_SPAN,
  bentoGridSchema,
} from './bento-grid.schema'

export const bentoGridDefinition = defineBlock({
  id: blockId('bento-grid'),
  name: 'Bento grid',
  description: 'An asymmetric grid whose cells take any block, with spans and a gapless mode.',
  category: 'marketing',
  tags: ['marketing', 'bento', 'grid', 'asymmetric', 'panel'],
  icon: 'layout-grid',

  propsSchema: bentoGridSchema,
  defaults: bentoGridSchema.parse({}),
  previewProps: bentoGridSchema.parse({
    heading: '',
    cells: [
      { colSpan: 2, rowSpan: 2 },
      { colSpan: 2, rowSpan: 1 },
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 1, rowSpan: 1 },
    ],
  }),

  slots: [
    {
      name: 'children',
      label: 'Cells',
      accepts: '*',
      minChildren: 0,
      maxChildren: MAX_CELLS,
      orientation: () => 'grid',
    },
  ],

  controls: [
    sectionCopyGroup(),
    {
      id: 'layout',
      label: 'Layout',
      controls: [
        {
          path: 'cells',
          kind: 'list',
          label: 'Cells',
          hint: 'Each entry is one cell, in order. A breakpoint override replaces the whole arrangement',
          responsive: true,
          options: {
            max: MAX_CELLS,
            sortable: true,
            itemTemplate: { colSpan: 1, rowSpan: 1 },
            itemControls: [
              {
                path: 'colSpan',
                kind: 'stepper',
                label: 'Columns',
                options: { min: 1, max: MAX_COL_SPAN },
              },
              {
                path: 'rowSpan',
                kind: 'stepper',
                label: 'Rows',
                options: { min: 1, max: MAX_ROW_SPAN },
              },
            ],
          },
        },
        {
          path: 'narrow',
          kind: 'segmented',
          label: 'On narrow',
          hint: 'Below 640 px: swipe through the cells, or stack them',
          options: { options: optionsFrom(NARROW_LAYOUTS) },
        },
        {
          path: 'gapless',
          kind: 'switch',
          label: 'Gapless',
          hint: 'Cells share a hairline instead of a gap',
        },
        {
          path: 'cellHeight',
          kind: 'segmented',
          label: 'Cell height',
          responsive: true,
          options: { options: optionsFrom(CELL_HEIGHTS) },
        },
        ...SECTION_FRAME_CONTROLS,
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: true,
    requiresBackdrop: false,
    supportsMotion: ['entrance', 'scroll'],
    costClass: 'cheap',
    containerQuery: true,
  },

  defaultMotion: bentoGridMotion,

  codegen: {
    tag: 'section',
    client: {
      kind: 'never',
      reason: 'Tiles spanning a grid: every cell is markup and every span is a class.',
    },
  },

  a11y: {
    notes: [
      'A plain grid of divs, not `role="grid"`: the cells hold arbitrary content and a grid role would promise keyboard cell navigation the block does not implement.',
      'Spans apply from the large breakpoint up. Below it the composition is a single column in document order, so the reading order is the order the cells were placed.',
      'Each cell is its own container-query scope, so what a user puts in a two-track cell sizes itself against that cell rather than against the window.',
    ],
  },
})
