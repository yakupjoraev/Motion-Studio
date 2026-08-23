import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { optionsFrom } from '../../scales'

import { videoMotion } from './video.motion'
import { VIDEO_ASPECTS, VIDEO_RADII, VIDEO_URL_MAX_LENGTH, videoSchema } from './video.schema'

export const videoDefinition = defineBlock({
  id: blockId('video'),
  name: 'Video',
  description: 'A video file in a framed figure, with captions and an honest autoplay.',
  category: 'content',
  tags: ['video', 'media', 'figure'],
  icon: 'video',

  propsSchema: videoSchema,
  defaults: videoSchema.parse({}),
  previewProps: videoSchema.parse({ aspect: 'video', caption: 'Export, end to end' }),

  slots: [],

  controls: [
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'src',
          kind: 'text',
          label: 'Video URL',
          hint: 'MP4 or WebM. A third-party embed is an iframe, and this block does not render one',
          options: { maxLength: VIDEO_URL_MAX_LENGTH },
        },
        {
          path: 'poster',
          kind: 'image',
          label: 'Poster',
          hint: 'What shows before playback and under reduced motion',
        },
        {
          path: 'captions',
          kind: 'text',
          label: 'Captions track',
          hint: 'A WebVTT file. Required unless the footage is decorative',
          options: { maxLength: VIDEO_URL_MAX_LENGTH },
        },
        {
          path: 'decorative',
          kind: 'switch',
          label: 'Decorative',
          hint: 'The footage says nothing the page does not',
        },
        { path: 'caption', kind: 'text', label: 'Caption', options: { maxLength: 300 } },
      ],
    },
    {
      id: 'playback',
      label: 'Playback',
      controls: [
        { path: 'controls', kind: 'switch', label: 'Controls' },
        {
          path: 'autoplay',
          kind: 'switch',
          label: 'Autoplay',
          hint: 'Starts from script and never under reduced motion; a poster is what shows instead',
        },
        { path: 'loop', kind: 'switch', label: 'Loop' },
        {
          path: 'muted',
          kind: 'switch',
          label: 'Muted',
          hint: 'Autoplay forces it — a page that makes noise at somebody is blocked anyway',
        },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [
        {
          path: 'aspect',
          kind: 'select',
          label: 'Aspect',
          responsive: true,
          options: { options: optionsFrom(VIDEO_ASPECTS) },
        },
        {
          path: 'radius',
          kind: 'radius',
          label: 'Radius',
          options: { options: optionsFrom(VIDEO_RADII) },
        },
        { path: 'hidden', kind: 'switch', label: 'Hidden', responsive: true },
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: false,
    requiresBackdrop: false,
    supportsMotion: ['entrance', 'scroll'],
    costClass: 'heavy',
    minWidth: 120,
  },

  defaultMotion: videoMotion,

  codegen: {
    tag: 'video',
    passthroughProps: ['src', 'poster', 'controls', 'loop', 'muted'],
    client: {
      kind: 'whenAnyProp',
      props: ['autoplay'],
      reason:
        'Autoplay is started from an effect that checks reduced motion first. A video the reader drives with controls is an element with attributes.',
    },
  },

  a11y: {
    notes: [
      'Autoplay carries no attribute: playback starts from script and only when motion is allowed, so reduced motion leaves the poster on screen.',
      'Footage that carries information needs a captions track; footage that carries none says so with the decorative flag, and the export report is told when it has neither.',
      'Autoplay forces muted, because the alternative is a combination a browser blocks and a document that claims otherwise.',
      'Controls stay keyboard-reachable: a video the user drives is motion they asked for, which the reduced-motion policy does not govern.',
    ],
  },
})
