import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { MAX_WIDTH_SCALE, SPACE_SCALE, SURFACE_TOKENS, optionsFrom } from '../../scales'

import { sectionMotion } from './section.motion'
import { MIN_HEIGHTS, sectionSchema } from './section.schema'

export const sectionDefinition = defineBlock({
  id: blockId('section'),
  name: 'Section',
  description: 'A full-width band that holds a page section.',
  category: 'layout',
  tags: ['layout', 'band', 'container'],
  icon: 'layout',

  propsSchema: sectionSchema,
  defaults: sectionSchema.parse({}),
  previewProps: { ...sectionSchema.parse({}), background: 'surface-1', padding: 'md' },

  slots: [
    {
      name: 'children',
      label: 'Content',
      accepts: '*',
      minChildren: 0,
      maxChildren: null,
    },
  ],

  controls: [
    {
      id: 'layout',
      label: 'Layout',
      controls: [
        {
          path: 'maxWidth',
          kind: 'select',
          label: 'Max width',
          responsive: true,
          options: { options: optionsFrom(MAX_WIDTH_SCALE) },
        },
        {
          path: 'padding',
          kind: 'select',
          label: 'Padding',
          responsive: true,
          options: { options: optionsFrom(SPACE_SCALE) },
        },
        { path: 'align', kind: 'align', label: 'Align', responsive: true },
        {
          path: 'minHeight',
          kind: 'select',
          label: 'Min height',
          responsive: true,
          options: { options: optionsFrom(MIN_HEIGHTS) },
        },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [
        {
          path: 'background',
          kind: 'select',
          label: 'Background',
          options: { options: optionsFrom(SURFACE_TOKENS) },
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

  defaultMotion: sectionMotion,

  codegen: { tag: 'section' },

  a11y: {
    notes: [
      'Renders a <section>, so a landmark exists for the band.',
      'Give it a heading as its first child: a section with no accessible name is a region a screen reader cannot describe.',
    ],
  },
})
