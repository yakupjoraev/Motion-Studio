import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { SECTION_FRAME_CONTROLS, sectionCopyGroup } from '../marketing.controls'
import {
  ALT_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  EYEBROW_MAX_LENGTH,
  TITLE_MAX_LENGTH,
} from '../marketing.schema'

import { featureSplitMotion } from './feature-split.motion'
import { MAX_SPLIT_ROWS, featureSplitSchema } from './feature-split.schema'

const defaults = featureSplitSchema.parse({})

export const featureSplitDefinition = defineBlock({
  id: blockId('feature-split'),
  name: 'Feature split',
  description: 'Text and media rows that alternate sides, with a per-row override.',
  category: 'marketing',
  tags: ['marketing', 'features', 'split', 'media', 'alternating'],
  icon: 'layout-columns',

  propsSchema: featureSplitSchema,
  defaults,
  previewProps: featureSplitSchema.parse({
    rows: defaults.rows.slice(0, 1),
    heading: '',
  }),

  slots: [],

  controls: [
    sectionCopyGroup(),
    {
      id: 'layout',
      label: 'Layout',
      controls: [
        {
          path: 'alternate',
          kind: 'switch',
          label: 'Alternate sides',
          hint: 'Each row swaps the side the picture sits on',
        },
        ...SECTION_FRAME_CONTROLS,
      ],
    },
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'rows',
          kind: 'list',
          label: 'Rows',
          options: {
            max: MAX_SPLIT_ROWS,
            labelKey: 'title',
            sortable: true,
            itemTemplate: {
              eyebrow: '',
              title: 'A feature worth a row of its own',
              body: 'Two or three sentences on what it does.',
              media: {
                src: '',
                alt: '',
                width: 1600,
                height: 1000,
                sizes: '(min-width: 1024px) 50vw, 100vw',
              },
              reversed: false,
            },
            itemControls: [
              {
                path: 'eyebrow',
                kind: 'text',
                label: 'Eyebrow',
                options: { maxLength: EYEBROW_MAX_LENGTH },
              },
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
                options: { maxLength: DESCRIPTION_MAX_LENGTH, rows: 3 },
              },
              { path: 'media.src', kind: 'image', label: 'Image' },
              {
                path: 'media.alt',
                kind: 'text',
                label: 'Alt text',
                hint: 'Empty means you decided it is decorative',
                options: { maxLength: ALT_MAX_LENGTH },
              },
              { path: 'reversed', kind: 'switch', label: 'Flip this row' },
            ],
          },
        },
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

  defaultMotion: featureSplitMotion,

  codegen: {
    tag: 'section',
    client: {
      kind: 'never',
      reason: 'Copy beside media, with the order of the two a class.',
    },
  },

  a11y: {
    notes: [
      'Reversing a row moves the picture with CSS `order`, so the reading and tab order stay copy-then-picture on every row however the section alternates.',
      'Row titles sit one heading level below the section header, so the outline stays continuous.',
      'Every picture carries width, height and sizes, so a row reserves its box before the image arrives.',
    ],
  },
})
