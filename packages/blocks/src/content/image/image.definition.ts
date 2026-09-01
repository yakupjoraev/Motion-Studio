import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { optionsFrom } from '../../scales'

import { imageMotion } from './image.motion'
import {
  ALT_MAX_LENGTH,
  ASPECTS,
  CAPTION_MAX_LENGTH,
  FITS,
  IMAGE_RADII,
  imageSchema,
} from './image.schema'

export const imageDefinition = defineBlock({
  id: blockId('image'),
  name: 'Image',
  description: 'A framed image with a required alt decision and an optional caption.',
  category: 'content',
  tags: ['image', 'photo', 'media', 'figure'],
  icon: 'image',

  propsSchema: imageSchema,
  // `alt` has no default, so the block's own defaults have to state the decision like anyone else.
  defaults: imageSchema.parse({ alt: '' }),
  previewProps: imageSchema.parse({ alt: '', aspect: 'video', caption: 'The studio, mid-edit' }),

  slots: [],

  controls: [
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'src',
          kind: 'image',
          label: 'Image',
          hint: 'A file, a URL, or a data URL within the format’s size limit',
        },
        {
          path: 'alt',
          kind: 'text',
          label: 'Alt text',
          hint: 'Required. Leave it empty only when the image is decorative — that is a decision, not a skip',
          options: { maxLength: ALT_MAX_LENGTH },
        },
        {
          path: 'caption',
          kind: 'text',
          label: 'Caption',
          options: { maxLength: CAPTION_MAX_LENGTH },
        },
      ],
    },
    {
      id: 'layout',
      label: 'Layout',
      controls: [
        {
          path: 'aspect',
          kind: 'select',
          label: 'Aspect',
          responsive: true,
          options: { options: optionsFrom(ASPECTS) },
        },
        {
          path: 'fit',
          kind: 'segmented',
          label: 'Fit',
          options: { options: optionsFrom(FITS) },
        },
        {
          path: 'width',
          kind: 'number',
          label: 'Width',
          hint: 'The file’s real pixel width — it is what reserves the box',
          options: { min: 1, max: 8192, step: 1 },
        },
        {
          path: 'height',
          kind: 'number',
          label: 'Height',
          options: { min: 1, max: 8192, step: 1 },
        },
        {
          path: 'sizes',
          kind: 'text',
          label: 'Sizes',
          hint: 'How wide the image renders at each breakpoint; 100vw unless you know better',
          options: { maxLength: 200 },
        },
        { path: 'hidden', kind: 'switch', label: 'Hidden', responsive: true },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [
        {
          path: 'radius',
          // The prop is a token from `IMAGE_RADII`, so the control is the select its options are
          // written for; `radius` is the four-corner object control and dropped every commit — ADR-317.
          kind: 'select',
          label: 'Radius',
          options: { options: optionsFrom(IMAGE_RADII) },
        },
        {
          path: 'priority',
          kind: 'switch',
          label: 'Above the fold',
          hint: 'Requests it with the document instead of lazily. Only for what is visible first',
        },
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: false,
    requiresBackdrop: false,
    supportsMotion: ['entrance', 'scroll', 'hover'],
    costClass: 'cheap',
    minWidth: 64,
  },

  defaultMotion: imageMotion,

  /**
   * ADR-119: the *element* is an `<img>` and this is where the export decides otherwise. The Next
   * target emits `next/image` and needs the import; every other target prints the `img` as it stands.
   */
  codegen: {
    tag: 'img',
    imports: [{ from: 'next/image', default: 'Image' }],
    passthroughProps: ['src', 'alt', 'width', 'height', 'sizes'],
    client: {
      kind: 'never',
      reason:
        'An image element with its box reserved; lazy loading is an attribute the browser reads.',
    },
  },

  a11y: {
    notes: [
      'alt is a required field with an empty value allowed: a decorative image and an undescribed one are indistinguishable in markup, so the schema makes the author answer rather than skip.',
      'The caption is a figcaption beside the image, not a replacement for alt — one describes the picture, the other comments on it.',
      'Width and height are always emitted, so the box is reserved and the page does not shift when the file arrives.',
    ],
  },
})
