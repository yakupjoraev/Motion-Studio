import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { MAX_WIDTH_SCALE, SPACE_SCALE, SURFACE_TOKENS, optionsFrom } from '../../scales'

import { sectionMotion } from './section.motion'
import { MIN_HEIGHTS, OVERFLOW, sectionSchema } from './section.schema'

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
      orientation: () => 'vertical',
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
        {
          path: 'overflow',
          kind: 'select',
          label: 'Overflow',
          options: { options: optionsFrom(OVERFLOW) },
        },
        { path: 'sticky', kind: 'switch', label: 'Sticky', hint: 'Holds the top of the viewport' },
        { path: 'hidden', kind: 'switch', label: 'Hidden', responsive: true },
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
        {
          path: 'fullBleed',
          kind: 'switch',
          label: 'Full bleed',
          hint: 'The background runs to the window edges',
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

  codegen: {
    tag: 'section',
    client: {
      kind: 'never',
      reason: 'A padded band: the padding, the width cap and the tint are classes on one element.',
    },
  },

  a11y: {
    notes: [
      'Renders a <section>, so a landmark exists for the band.',
      'Give it a heading as its first child: a section with no accessible name is a region a screen reader cannot describe.',
    ],
  },
})
