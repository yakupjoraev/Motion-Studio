import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { SURFACE_TOKENS, optionsFrom } from '../../scales'
import { HERO_COPY_CONTROLS, HERO_FRAME_CONTROLS } from '../hero.controls'

import { heroSplitMotion } from './hero-split.motion'
import { MEDIA_ASPECTS, SPLIT_RATIOS, heroSplitSchema } from './hero-split.schema'

export const heroSplitDefinition = defineBlock({
  id: blockId('hero-split'),
  name: 'Hero — split',
  description: 'Text on one side, any block on the other. Reversible.',
  category: 'hero',
  tags: ['hero', 'landing', 'split', 'media'],
  icon: 'layout-columns',

  propsSchema: heroSplitSchema,
  defaults: heroSplitSchema.parse({}),
  previewProps: heroSplitSchema.parse({ minHeight: 'auto', padding: 'lg', ratio: 'text-wide' }),

  slots: [
    {
      name: 'media',
      label: 'Media',
      accepts: '*',
      minChildren: 0,
      maxChildren: 1,
    },
  ],

  controls: [
    { id: 'content', label: 'Content', controls: HERO_COPY_CONTROLS },
    {
      id: 'layout',
      label: 'Layout',
      controls: [
        ...HERO_FRAME_CONTROLS,
        {
          path: 'ratio',
          kind: 'select',
          label: 'Ratio',
          responsive: true,
          options: { options: optionsFrom(SPLIT_RATIOS) },
        },
        {
          path: 'reverse',
          kind: 'switch',
          label: 'Media first',
          responsive: true,
          hint: 'Paints the media on the left; the text still reads first on a phone',
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
        {
          path: 'mediaAspect',
          kind: 'select',
          label: 'Media aspect',
          options: { options: optionsFrom(MEDIA_ASPECTS) },
        },
        {
          path: 'mediaFrame',
          kind: 'switch',
          label: 'Media frame',
          hint: 'Hairline, radius and shadow around the slot',
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

  defaultMotion: heroSplitMotion,

  codegen: {
    tag: 'section',
    client: {
      kind: 'never',
      reason: 'Two columns of markup; the media is an element and the reversal is a class.',
    },
  },

  a11y: {
    notes: [
      'The text column is first in the DOM whichever side it is painted on, so the reading and tab order are headline before media.',
      'The media plate holds its aspect ratio, so a slot that loads late moves nothing under the pointer.',
      'Whatever the user drops into the slot carries its own accessible name; this block does not invent one for it.',
    ],
  },
})
