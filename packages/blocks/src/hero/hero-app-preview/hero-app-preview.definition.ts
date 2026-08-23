import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { SURFACE_TOKENS, optionsFrom } from '../../scales'
import { HERO_COPY_CONTROLS, HERO_FRAME_CONTROLS } from '../hero.controls'

import { heroAppPreviewMotion } from './hero-app-preview.motion'
import {
  PERSPECTIVE_MAX,
  PERSPECTIVE_MIN,
  TILT_LIMIT,
  heroAppPreviewSchema,
} from './hero-app-preview.schema'

export const heroAppPreviewDefinition = defineBlock({
  id: blockId('hero-app-preview'),
  name: 'Hero — app preview',
  description: 'Text beside a perspective-tilted screenshot with an accent glow.',
  category: 'hero',
  tags: ['hero', 'landing', 'screenshot', 'product'],
  icon: 'image',

  propsSchema: heroAppPreviewSchema,
  defaults: heroAppPreviewSchema.parse({}),
  previewProps: heroAppPreviewSchema.parse({ minHeight: 'auto', padding: 'lg', tiltY: -16 }),

  slots: [],

  controls: [
    { id: 'content', label: 'Content', controls: HERO_COPY_CONTROLS },
    { id: 'layout', label: 'Layout', controls: HERO_FRAME_CONTROLS },
    {
      id: 'media',
      label: 'Screenshot',
      controls: [
        {
          path: 'image',
          kind: 'image',
          label: 'Image',
          hint: 'Empty renders a window in surface tokens, which is a finished default rather than a gap',
        },
        {
          path: 'imageWidth',
          kind: 'number',
          label: 'Width',
          hint: 'The file’s real pixel width — it is what reserves the box',
          options: { min: 1, max: 8192, step: 1 },
        },
        {
          path: 'imageHeight',
          kind: 'number',
          label: 'Height',
          options: { min: 1, max: 8192, step: 1 },
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
          path: 'tiltX',
          kind: 'slider',
          label: 'Tilt X',
          options: { min: -TILT_LIMIT, max: TILT_LIMIT, step: 1, unit: 'deg' },
        },
        {
          path: 'tiltY',
          kind: 'slider',
          label: 'Tilt Y',
          options: { min: -TILT_LIMIT, max: TILT_LIMIT, step: 1, unit: 'deg' },
        },
        {
          path: 'perspective',
          kind: 'slider',
          label: 'Perspective',
          hint: 'Lower is a stronger lens; higher flattens the rotation out',
          options: { min: PERSPECTIVE_MIN, max: PERSPECTIVE_MAX, step: 50, unit: 'px' },
        },
        { path: 'glow', kind: 'switch', label: 'Accent glow' },
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: true,
    requiresBackdrop: false,
    // `hover` is listed so the motion panel offers `tilt-3d`; `defaultMotion` deliberately omits it.
    supportsMotion: ['entrance', 'scroll', 'hover'],
    costClass: 'moderate',
  },

  defaultMotion: heroAppPreviewMotion,

  codegen: {
    tag: 'section',
    client: {
      kind: 'never',
      reason: 'A tilted plate and a glow behind it: one transform and one gradient.',
    },
  },

  a11y: {
    notes: [
      'The screenshot carries the alt text the image control collects; the export report is what refuses an empty one, because a user mid-upload has not made a mistake yet.',
      'The stand-in window is aria-hidden — it is furniture, and describing four grey bars to somebody is not a product.',
      'The glow is decorative, empty and rendered after the plate.',
      'The tilt is a transform, so it moves nothing in the layout and reading order is unaffected by it.',
    ],
  },
})
