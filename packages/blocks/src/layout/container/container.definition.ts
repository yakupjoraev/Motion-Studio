import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { MAX_WIDTH_SCALE, SPACE_SCALE, optionsFrom } from '../../scales'

import { containerMotion } from './container.motion'
import {
  CONTAINER_ALIGN,
  CONTAINER_JUSTIFY,
  DIRECTIONS,
  LAYOUT_MODES,
  containerSchema,
} from './container.schema'

export const containerDefinition = defineBlock({
  id: blockId('container'),
  name: 'Container',
  description: 'A flex box with direction, gap and alignment exposed.',
  category: 'layout',
  tags: ['layout', 'flex', 'stack'],
  icon: 'box',

  propsSchema: containerSchema,
  defaults: containerSchema.parse({}),
  previewProps: { ...containerSchema.parse({}), gap: 'lg', padding: 'md' },

  slots: [
    {
      name: 'children',
      label: 'Content',
      accepts: '*',
      minChildren: 0,
      maxChildren: null,
      orientation: (props) =>
        props['mode'] === 'grid'
          ? 'grid'
          : props['direction'] === 'row'
            ? 'horizontal'
            : 'vertical',
    },
  ],

  controls: [
    {
      id: 'layout',
      label: 'Layout',
      controls: [
        {
          path: 'mode',
          kind: 'segmented',
          label: 'Mode',
          options: { options: optionsFrom(LAYOUT_MODES) },
        },
        {
          path: 'columns',
          kind: 'stepper',
          label: 'Columns',
          hint: 'Grid mode only',
          responsive: true,
          options: { min: 1, max: 4 },
        },
        {
          path: 'direction',
          kind: 'segmented',
          label: 'Direction',
          responsive: true,
          options: { options: optionsFrom(DIRECTIONS) },
        },
        {
          path: 'gap',
          kind: 'select',
          label: 'Gap',
          responsive: true,
          options: { options: optionsFrom(SPACE_SCALE) },
        },
        {
          path: 'padding',
          kind: 'select',
          label: 'Padding',
          responsive: true,
          options: { options: optionsFrom(SPACE_SCALE) },
        },
        {
          path: 'align',
          kind: 'segmented',
          label: 'Align',
          responsive: true,
          options: { options: optionsFrom(CONTAINER_ALIGN) },
        },
        {
          path: 'justify',
          kind: 'segmented',
          label: 'Justify',
          responsive: true,
          options: { options: optionsFrom(CONTAINER_JUSTIFY) },
        },
        { path: 'wrap', kind: 'switch', label: 'Wrap', responsive: true },
        { path: 'hidden', kind: 'switch', label: 'Hidden', responsive: true },
        {
          path: 'maxWidth',
          kind: 'select',
          label: 'Max width',
          responsive: true,
          options: { options: optionsFrom(MAX_WIDTH_SCALE) },
        },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [
        { path: 'divide', kind: 'switch', label: 'Divide', hint: 'A rule between the children' },
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: false,
    requiresBackdrop: false,
    supportsMotion: ['entrance', 'scroll'],
    costClass: 'cheap',
  },

  defaultMotion: containerMotion,

  codegen: { tag: 'div' },

  a11y: {
    notes: [
      'Renders a plain <div>: a container is layout, and a landmark here would compete with the section around it.',
      'Reordering children changes the reading order, because the layout is flow rather than absolute.',
    ],
  },
})
