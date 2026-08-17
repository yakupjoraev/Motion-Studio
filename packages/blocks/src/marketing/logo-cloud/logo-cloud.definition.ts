import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { optionsFrom } from '../../scales'
import { SECTION_FRAME_CONTROLS, sectionCopyGroup } from '../marketing.controls'
import {
  ALT_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  MARQUEE_MAX_DURATION,
  MARQUEE_MIN_DURATION,
} from '../marketing.schema'

import { logoCloudMotion } from './logo-cloud.motion'
import {
  LOGO_MAX_COLUMNS,
  LOGO_MIN_COLUMNS,
  LOGO_MODES,
  MAX_LOGOS,
  logoCloudSchema,
} from './logo-cloud.schema'

export const logoCloudDefinition = defineBlock({
  id: blockId('logo-cloud'),
  name: 'Logo cloud',
  description: 'Company marks as a grid or one scrolling track, sizes normalised.',
  category: 'marketing',
  tags: ['marketing', 'logos', 'social proof', 'marquee', 'grid'],
  icon: 'group',

  propsSchema: logoCloudSchema,
  defaults: logoCloudSchema.parse({}),
  previewProps: logoCloudSchema.parse({
    heading: '',
    columns: 3,
    logos: logoCloudSchema.parse({}).logos.slice(0, 6),
  }),

  slots: [],

  controls: [
    sectionCopyGroup(),
    {
      id: 'layout',
      label: 'Layout',
      controls: [
        {
          path: 'mode',
          kind: 'segmented',
          label: 'Mode',
          options: { options: optionsFrom(LOGO_MODES) },
        },
        {
          path: 'columns',
          kind: 'stepper',
          label: 'Columns',
          hint: 'Grid mode. Two on a phone whatever this says',
          responsive: true,
          options: { min: LOGO_MIN_COLUMNS, max: LOGO_MAX_COLUMNS },
        },
        {
          path: 'grayscale',
          kind: 'switch',
          label: 'Grey until hovered',
          hint: 'A row of full-colour marks competes with the page and with itself',
        },
        ...SECTION_FRAME_CONTROLS,
      ],
    },
    {
      id: 'marquee',
      label: 'Marquee',
      controls: [
        {
          path: 'duration',
          kind: 'slider',
          label: 'Cycle',
          options: { min: MARQUEE_MIN_DURATION, max: MARQUEE_MAX_DURATION, step: 1000, unit: 'ms' },
        },
        { path: 'pauseOnHover', kind: 'switch', label: 'Pause on hover' },
        { path: 'fadeEdges', kind: 'switch', label: 'Fade the edges' },
      ],
    },
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'logos',
          kind: 'list',
          label: 'Marks',
          options: {
            max: MAX_LOGOS,
            labelKey: 'label',
            sortable: true,
            itemTemplate: { label: 'Company', src: '', alt: '' },
            itemControls: [
              {
                path: 'label',
                kind: 'text',
                label: 'Name',
                hint: 'Shown as a word-mark until a file arrives, and used as the alt text',
                options: { maxLength: LABEL_MAX_LENGTH },
              },
              { path: 'src', kind: 'image', label: 'File' },
              {
                path: 'alt',
                kind: 'text',
                label: 'Alt text',
                hint: 'Defaults to the name',
                options: { maxLength: ALT_MAX_LENGTH },
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
    requiresBackdrop: false,
    supportsMotion: ['entrance'],
    costClass: 'moderate',
  },

  defaultMotion: logoCloudMotion,

  codegen: { tag: 'section' },

  a11y: {
    notes: [
      'Every mark carries the company name as its alt text, because in a logo cloud the marks are the content — an empty alt would delete the proof for anyone not looking at it.',
      'Grid mode is a list, so a reader hears how many companies there are.',
      'Marquee mode pauses on hover, and under reduced motion it stops and centres — which is what grid mode looks like, so nothing reads as broken.',
      'Marks are normalised by height rather than by width, so a tall roundel and a wide wordmark carry the same visual weight.',
    ],
  },
})
