import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { optionsFrom } from '../../scales'
import { HERO_COPY_CONTROLS, HERO_FRAME_CONTROLS } from '../hero.controls'

import { heroVideoMotion } from './hero-video.motion'
import { URL_MAX_LENGTH, VIDEO_SCRIMS, heroVideoSchema } from './hero-video.schema'

export const heroVideoDefinition = defineBlock({
  id: blockId('hero-video'),
  name: 'Hero — video',
  description: 'A full-bleed muted loop under a scrim, with the poster carrying the design.',
  category: 'hero',
  tags: ['hero', 'landing', 'video', 'media'],
  icon: 'video',

  propsSchema: heroVideoSchema,
  defaults: heroVideoSchema.parse({}),
  previewProps: heroVideoSchema.parse({ minHeight: 'auto', padding: 'lg', scrim: 'medium' }),

  slots: [],

  controls: [
    { id: 'content', label: 'Content', controls: HERO_COPY_CONTROLS },
    { id: 'layout', label: 'Layout', controls: HERO_FRAME_CONTROLS },
    {
      id: 'media',
      label: 'Media',
      controls: [
        {
          path: 'src',
          kind: 'text',
          label: 'Video URL',
          hint: 'MP4 or WebM. Muted and looping — a hero is not a player',
          options: { maxLength: URL_MAX_LENGTH },
        },
        {
          path: 'poster',
          kind: 'image',
          label: 'Poster',
          hint: 'What shows before playback and under reduced motion — design it, do not grab it',
        },
        {
          path: 'captions',
          kind: 'text',
          label: 'Captions track',
          hint: 'A WebVTT file. Required unless the footage is decorative',
          options: { maxLength: URL_MAX_LENGTH },
        },
        {
          path: 'decorative',
          kind: 'switch',
          label: 'Decorative',
          hint: 'The footage says nothing the copy does not',
        },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [
        {
          path: 'scrim',
          kind: 'segmented',
          label: 'Scrim',
          options: { options: optionsFrom(VIDEO_SCRIMS) },
        },
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: true,
    requiresBackdrop: false,
    supportsMotion: ['entrance', 'scroll'],
    costClass: 'heavy',
  },

  defaultMotion: heroVideoMotion,

  codegen: {
    tag: 'section',
    client: {
      kind: 'whenAnyProp',
      props: ['src'],
      reason:
        'Playback is started from an effect that checks reduced motion first. With no source the poster and the copy are markup.',
    },
  },

  a11y: {
    notes: [
      'No autoplay attribute: playback starts from script, and only when motion is allowed. Under reduced motion the poster is what stays on screen.',
      'Decorative footage is aria-hidden. Footage that carries information needs a captions track, and the export report is told when it has neither.',
      'The video is muted and has no controls, so it is never a media player a keyboard user has to escape from.',
      'The scrim is a surface token, so text contrast holds in both colour modes regardless of what the footage looks like.',
    ],
  },
})
