import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { optionsFrom } from '../../scales'
import { SECTION_FRAME_CONTROLS, sectionCopyGroup } from '../marketing.controls'
import { BODY_MAX_LENGTH, CARD_TREATMENTS, TITLE_MAX_LENGTH } from '../marketing.schema'

import { featureGridMotion } from './feature-grid.motion'
import {
  FEATURE_MAX_COLUMNS,
  FEATURE_MIN_COLUMNS,
  MAX_FEATURE_CELLS,
  featureGridSchema,
} from './feature-grid.schema'

export const featureGridDefinition = defineBlock({
  id: blockId('feature-grid'),
  name: 'Feature grid',
  description: 'Icon, title and a sentence per cell, in two to four columns.',
  category: 'marketing',
  tags: ['marketing', 'features', 'grid', 'cards', 'icons'],
  icon: 'layout-grid',

  propsSchema: featureGridSchema,
  defaults: featureGridSchema.parse({}),
  previewProps: featureGridSchema.parse({
    columns: 3,
    items: featureGridSchema.parse({}).items.slice(0, 3),
  }),

  slots: [],

  controls: [
    sectionCopyGroup(),
    {
      id: 'layout',
      label: 'Layout',
      controls: [
        {
          path: 'columns',
          kind: 'stepper',
          label: 'Columns',
          responsive: true,
          options: { min: FEATURE_MIN_COLUMNS, max: FEATURE_MAX_COLUMNS },
        },
        {
          path: 'treatment',
          kind: 'segmented',
          label: 'Cells',
          hint: 'Glass needs a background behind it',
          options: { options: optionsFrom(CARD_TREATMENTS) },
        },
        { path: 'showIcons', kind: 'switch', label: 'Show icons' },
        ...SECTION_FRAME_CONTROLS,
      ],
    },
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'items',
          kind: 'list',
          label: 'Features',
          options: {
            max: MAX_FEATURE_CELLS,
            labelKey: 'title',
            sortable: true,
            itemTemplate: { icon: 'zap', title: 'Feature', body: 'What it does, in one sentence.' },
            itemControls: [
              { path: 'icon', kind: 'icon', label: 'Icon' },
              {
                path: 'title',
                kind: 'text',
                label: 'Title',
                options: { maxLength: TITLE_MAX_LENGTH },
              },
              {
                path: 'body',
                kind: 'textarea',
                label: 'Body',
                options: { maxLength: BODY_MAX_LENGTH, rows: 2 },
              },
            ],
          },
        },
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: true,
    requiresBackdrop: true,
    supportsMotion: ['entrance', 'scroll'],
    costClass: 'cheap',
    containerQuery: true,
  },

  defaultMotion: featureGridMotion,

  codegen: { tag: 'section' },

  a11y: {
    notes: [
      'The cells are a <ul>, so a screen reader announces how many features there are before reading the first one.',
      'Cell titles sit one heading level below the section header, so the page outline stays continuous whatever level the header is set to.',
      'The icons are decorative and aria-hidden: every one of them repeats what the title beside it already says.',
    ],
  },
})
