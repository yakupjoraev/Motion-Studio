import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { SECTION_FRAME_CONTROLS, sectionCopyGroup } from '../marketing.controls'
import { BODY_MAX_LENGTH, LABEL_MAX_LENGTH, TITLE_MAX_LENGTH } from '../marketing.schema'

import { comparisonTableMotion } from './comparison-table.motion'
import {
  CELL_NO,
  CELL_YES,
  COMPARISON_MAX_COLUMNS,
  COMPARISON_MAX_ROWS,
  comparisonTableSchema,
} from './comparison-table.schema'

export const comparisonTableDefinition = defineBlock({
  id: blockId('comparison-table'),
  name: 'Comparison table',
  description: 'A feature matrix with a sticky header row and a sticky first column.',
  category: 'marketing',
  tags: ['marketing', 'comparison', 'table', 'matrix', 'features'],
  icon: 'table',

  propsSchema: comparisonTableSchema,
  defaults: comparisonTableSchema.parse({}),
  previewProps: comparisonTableSchema.parse({
    heading: '',
    rows: comparisonTableSchema.parse({}).rows.slice(0, 4),
  }),

  slots: [],

  controls: [
    sectionCopyGroup(),
    {
      id: 'columns',
      label: 'Columns',
      controls: [
        {
          path: 'columns',
          kind: 'list',
          label: 'Columns',
          hint: 'One highlighted column reads as the recommendation; two read as indecision',
          options: {
            max: COMPARISON_MAX_COLUMNS,
            labelKey: 'label',
            sortable: true,
            itemTemplate: { label: 'Column', highlighted: false },
            itemControls: [
              {
                path: 'label',
                kind: 'text',
                label: 'Heading',
                options: { maxLength: LABEL_MAX_LENGTH },
              },
              { path: 'highlighted', kind: 'switch', label: 'Highlight' },
            ],
          },
        },
      ],
    },
    {
      id: 'rows',
      label: 'Rows',
      controls: [
        {
          path: 'rows',
          kind: 'list',
          label: 'Rows',
          options: {
            max: COMPARISON_MAX_ROWS,
            labelKey: 'label',
            sortable: true,
            itemTemplate: { label: 'A feature worth comparing', values: [CELL_YES, CELL_NO] },
            itemControls: [
              {
                path: 'label',
                kind: 'text',
                label: 'Feature',
                options: { maxLength: TITLE_MAX_LENGTH },
              },
              {
                path: 'values',
                kind: 'list',
                label: 'Values',
                hint: `One per column. "${CELL_YES}" and "${CELL_NO}" draw a mark; anything else is shown as text`,
                options: { max: COMPARISON_MAX_COLUMNS, itemTemplate: CELL_YES },
              },
            ],
          },
        },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [
        {
          path: 'regionLabel',
          kind: 'text',
          label: 'Region label',
          hint: 'Read aloud when a keyboard reader tabs into the scrollable table',
          options: { maxLength: BODY_MAX_LENGTH },
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
  },

  defaultMotion: comparisonTableMotion,

  codegen: {
    tag: 'section',
    client: {
      kind: 'never',
      reason: 'A table whose two sticky axes are position sticky and a z-index ladder in CSS.',
    },
  },

  a11y: {
    notes: [
      'A real table with a caption, column headers and row headers, so a cell is announced as the feature and the column it belongs to.',
      'Yes and no cells carry a tick or a dash plus the word off screen, so the answer never depends on colour or on seeing the glyph.',
      'A cell a row said nothing about renders an em dash labelled "Not applicable", rather than an empty box that reads as a bug.',
      'The table scrolls inside its own labelled region, which takes focus — so a keyboard reader can scroll it with the arrow keys, and the page itself never scrolls sideways.',
    ],
  },
})
