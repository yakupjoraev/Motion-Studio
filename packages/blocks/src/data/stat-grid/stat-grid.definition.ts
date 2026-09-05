import { blockId } from '@motion-studio/schema'

import { DELTA_DIRECTIONS, STAT_SIZES } from '../../content/stat/stat.schema'
import { defineBlock } from '../../define-block'
import { ALIGNMENTS, NARROW_LAYOUTS, optionsFrom } from '../../scales'
import { DATA_FRAME_CONTROLS } from '../data.controls'
import { CELL_MAX_LENGTH, LABEL_MAX_LENGTH } from '../data.schema'

import { statGridMotion } from './stat-grid.motion'
import { MAX_COLUMNS, MAX_STATS, MIN_COLUMNS, statGridSchema } from './stat-grid.schema'

export const statGridDefinition = defineBlock({
  id: blockId('stat-grid'),
  name: 'Stat grid',
  description: 'A divided grid of figures, each with its label and its change.',
  category: 'data',
  tags: ['stats', 'metrics', 'data', 'grid', 'numbers'],
  icon: 'layout-grid',

  propsSchema: statGridSchema,
  defaults: statGridSchema.parse({}),
  previewProps: statGridSchema.parse({
    columns: 2,
    items: statGridSchema.parse({}).items.slice(0, 4),
  }),

  slots: [],

  controls: [
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'items',
          kind: 'list',
          label: 'Figures',
          options: {
            max: MAX_STATS,
            labelKey: 'value',
            sortable: true,
            itemTemplate: {
              value: '0',
              label: '',
              delta: '',
              deltaDirection: 'up-is-good',
              deltaRose: true,
            },
            itemControls: [
              {
                path: 'value',
                kind: 'text',
                label: 'Figure',
                options: { maxLength: LABEL_MAX_LENGTH },
              },
              {
                path: 'label',
                kind: 'text',
                label: 'Label',
                options: { maxLength: CELL_MAX_LENGTH },
              },
              {
                path: 'delta',
                kind: 'text',
                label: 'Change',
                hint: 'Empty hides the change row',
                options: { maxLength: LABEL_MAX_LENGTH },
              },
              {
                path: 'deltaDirection',
                kind: 'select',
                label: 'Which way is good',
                hint: 'A falling error rate is an improvement, and the block cannot guess that',
                options: { options: optionsFrom(DELTA_DIRECTIONS) },
              },
              { path: 'deltaRose', kind: 'switch', label: 'Change went up' },
            ],
          },
        },
      ],
    },
    {
      id: 'layout',
      label: 'Layout',
      controls: [
        {
          path: 'columns',
          kind: 'stepper',
          label: 'Columns',
          responsive: true,
          options: { min: MIN_COLUMNS, max: MAX_COLUMNS },
        },
        {
          path: 'narrow',
          kind: 'segmented',
          label: 'On narrow',
          hint: 'Below 640 px: swipe through the figures, or stack them',
          options: { options: optionsFrom(NARROW_LAYOUTS) },
        },
        {
          path: 'align',
          kind: 'segmented',
          label: 'Align',
          options: { options: optionsFrom(ALIGNMENTS) },
        },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [
        {
          path: 'dividers',
          kind: 'switch',
          label: 'Dividers',
          hint: 'On, the grid is one plate divided; off, the figures sit on the page',
        },
        {
          path: 'size',
          kind: 'segmented',
          label: 'Figure size',
          responsive: true,
          options: { options: optionsFrom(STAT_SIZES) },
        },
        ...DATA_FRAME_CONTROLS,
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: false,
    requiresBackdrop: false,
    supportsMotion: ['entrance'],
    costClass: 'cheap',
    // RESPONSIVE_ENGINE.md § Container queries names this block; the cell draws its own containment (ADR-184).
    containerQuery: true,
  },

  defaultMotion: statGridMotion,

  codegen: {
    tag: 'div',
    client: {
      kind: 'never',
      reason:
        'Figures and their labels are markup — the block holds no state and attaches no handler.',
    },
  },

  a11y: {
    notes: [
      'The figures are a list, so a screen reader announces "list, 4 items" before the first number instead of reading four unrelated values.',
      'The change carries an arrow as well as a colour, so the direction survives greyscale — ACCESSIBILITY.md § Non-negotiables 4.',
      'Whether a change is good is the author’s answer rather than the block’s: a falling error rate is an improvement, and a green arrow pointing down says so.',
      'Nothing here takes focus, and nothing is disclosed by hover, so the block adds no tab stop to the page it is on.',
      'Tabular numerals, so a column of figures lines up and a reader comparing two of them does not have to re-read either.',
    ],
  },
})
