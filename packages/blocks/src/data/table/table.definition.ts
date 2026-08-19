import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { ALIGNMENTS, optionsFrom } from '../../scales'
import { DENSITY_CONTROL, SCROLL_REGION_CONTROLS } from '../data.controls'
import { CAPTION_MAX_LENGTH, CELL_MAX_LENGTH, LABEL_MAX_LENGTH } from '../data.schema'

import { tableMotion } from './table.motion'
import { MAX_TABLE_COLUMNS, MAX_TABLE_ROWS, tableSchema } from './table.schema'

export const tableDefinition = defineBlock({
  id: blockId('table'),
  name: 'Table',
  description: 'A sortable data table with a sticky header, zebra rows and an empty state.',
  category: 'data',
  tags: ['table', 'data', 'rows', 'sort', 'grid'],
  icon: 'table',

  propsSchema: tableSchema,
  defaults: tableSchema.parse({}),
  previewProps: tableSchema.parse({ rows: tableSchema.parse({}).rows.slice(0, 4) }),

  slots: [],

  controls: [
    {
      id: 'columns',
      label: 'Columns',
      controls: [
        {
          path: 'columns',
          kind: 'list',
          label: 'Columns',
          hint: 'A column of free text sorts into an order nobody asked for — turn sorting off for those',
          options: {
            max: MAX_TABLE_COLUMNS,
            labelKey: 'label',
            sortable: true,
            itemTemplate: { label: 'Column', align: 'start', sortable: true },
            itemControls: [
              {
                path: 'label',
                kind: 'text',
                label: 'Heading',
                options: { maxLength: LABEL_MAX_LENGTH },
              },
              {
                path: 'align',
                kind: 'segmented',
                label: 'Align',
                options: { options: optionsFrom(ALIGNMENTS) },
              },
              { path: 'sortable', kind: 'switch', label: 'Sortable' },
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
          hint: 'One value per column, in column order. A missing value shows as an em dash',
          options: {
            max: MAX_TABLE_ROWS,
            sortable: true,
            itemTemplate: { cells: [] },
            itemControls: [
              {
                path: 'cells',
                kind: 'list',
                label: 'Cells',
                options: { max: MAX_TABLE_COLUMNS, itemTemplate: '', maxLength: CELL_MAX_LENGTH },
              },
            ],
          },
        },
        {
          path: 'emptyMessage',
          kind: 'text',
          label: 'Empty message',
          hint: 'Shown inside the table body, spanning every column',
          options: { maxLength: CAPTION_MAX_LENGTH },
        },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [
        DENSITY_CONTROL,
        { path: 'zebra', kind: 'switch', label: 'Zebra rows' },
        {
          path: 'stickyHeader',
          kind: 'switch',
          label: 'Sticky header',
          hint: 'The header stays put while the rows scroll under it',
        },
        {
          path: 'caption',
          kind: 'text',
          label: 'Caption',
          hint: 'The table’s accessible name. Empty falls back to the region label',
          options: { maxLength: CAPTION_MAX_LENGTH },
        },
        {
          path: 'showCaption',
          kind: 'switch',
          label: 'Show caption',
          hint: 'Off keeps it in the markup for screen readers',
        },
        ...SCROLL_REGION_CONTROLS,
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: false,
    requiresBackdrop: false,
    supportsMotion: ['entrance'],
    costClass: 'moderate',
  },

  defaultMotion: tableMotion,

  codegen: {
    tag: 'div',
    dependencies: { '@tanstack/react-table': '^8.21.3' },
    imports: [
      {
        from: '@tanstack/react-table',
        named: ['getCoreRowModel', 'getSortedRowModel', 'useReactTable'],
      },
    ],
    client: {
      kind: 'always',
      reason:
        'useReactTable is called at every prop set and holds the sort state, and a hook cannot run in a Server Component.',
    },
  },

  a11y: {
    notes: [
      'A real table: caption, thead, th scope="col" and tbody, so a screen reader announces rows and columns rather than a grid of text.',
      'The caption is always in the markup and falls back to the region label, because a table with no accessible name is a dead end for a reader who lands in it.',
      'A sortable column’s control is the header button itself, and aria-sort on the cell carries the direction — the chevron is aria-hidden so the state is announced once.',
      'A column that cannot be sorted has no button and no aria-sort at all, which is how a reader tells the two kinds of heading apart.',
      'The scroller is a labelled region with tabindex="0", so a keyboard reader can reach it and scroll a wide table with the arrow keys.',
      'The empty state is a row inside the body spanning every column, so the explanation is inside the structure the reader is in.',
    ],
  },
})
