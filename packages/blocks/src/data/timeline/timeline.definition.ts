import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { ICON_NAME_MAX_LENGTH } from '../../interactive/interactive.schema'
import { optionsFrom } from '../../scales'
import { SCROLL_REGION_CONTROLS } from '../data.controls'
import { CAPTION_MAX_LENGTH, CELL_MAX_LENGTH, LABEL_MAX_LENGTH } from '../data.schema'

import { timelineMotion } from './timeline.motion'
import {
  MAX_TIMELINE_ITEMS,
  TIMELINE_MARKERS,
  TIMELINE_ORIENTATIONS,
  timelineSchema,
} from './timeline.schema'

export const timelineDefinition = defineBlock({
  id: blockId('timeline'),
  name: 'Timeline',
  description: 'An ordered sequence of steps, down the page or scrolling across it.',
  category: 'data',
  tags: ['timeline', 'roadmap', 'history', 'steps', 'changelog'],
  icon: 'timeline',

  propsSchema: timelineSchema,
  defaults: timelineSchema.parse({}),
  previewProps: timelineSchema.parse({ items: timelineSchema.parse({}).items.slice(0, 3) }),

  slots: [
    {
      name: 'steps',
      label: 'Steps',
      accepts: '*',
      minChildren: 0,
      maxChildren: MAX_TIMELINE_ITEMS,
      orientation: (props) => (props['orientation'] === 'horizontal' ? 'horizontal' : 'vertical'),
    },
  ],

  controls: [
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'items',
          kind: 'list',
          label: 'Steps',
          hint: 'A step’s text is shown until a block is dropped into it',
          options: {
            max: MAX_TIMELINE_ITEMS,
            labelKey: 'title',
            sortable: true,
            itemTemplate: { date: '', dateLabel: '', title: 'Step', body: '', icon: '' },
            itemControls: [
              {
                path: 'title',
                kind: 'text',
                label: 'Title',
                options: { maxLength: CAPTION_MAX_LENGTH },
              },
              {
                path: 'date',
                kind: 'text',
                label: 'Date value',
                hint: 'What a parser reads: 2026-03, 2026-03-18. Empty drops the time element',
                options: { maxLength: LABEL_MAX_LENGTH },
              },
              {
                path: 'dateLabel',
                kind: 'text',
                label: 'Date label',
                hint: 'What the reader sees. Empty shows the value',
                options: { maxLength: LABEL_MAX_LENGTH },
              },
              {
                path: 'body',
                kind: 'textarea',
                label: 'Text',
                options: { rows: 3, maxLength: CELL_MAX_LENGTH },
              },
              {
                path: 'icon',
                kind: 'icon',
                label: 'Icon',
                hint: 'Drawn in the marker when the marker is set to Icon',
                options: { maxLength: ICON_NAME_MAX_LENGTH },
              },
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
          path: 'orientation',
          kind: 'segmented',
          label: 'Direction',
          responsive: true,
          hint: 'Horizontal scrolls with snap and takes focus so a keyboard can move through it',
          options: { options: optionsFrom(TIMELINE_ORIENTATIONS) },
        },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [
        {
          path: 'marker',
          kind: 'segmented',
          label: 'Marker',
          options: { options: optionsFrom(TIMELINE_MARKERS) },
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
    costClass: 'cheap',
  },

  defaultMotion: timelineMotion,

  codegen: {
    tag: 'div',
    client: {
      kind: 'never',
      reason:
        'An ordered list with a time element per step, and the horizontal strip scrolls in CSS — no state, no handler.',
    },
  },

  a11y: {
    notes: [
      'An ordered list, because the order is the meaning: a screen reader announces each step with its position rather than reading four unrelated headings.',
      'The numbered marker is aria-hidden — the position is already in the list structure, and announcing "1" beside "item 1 of 4" says nothing twice.',
      'Each step carries a time element with the machine-readable value in datetime and the reader’s words as its text; a step with no date renders no empty element.',
      'Horizontal mode is a labelled region with tabindex="0", so a keyboard reader can reach the strip and move through it with the arrow keys.',
      'Vertical mode adds no tab stop at all, because it scrolls with the page and has nothing to focus.',
    ],
  },
})
