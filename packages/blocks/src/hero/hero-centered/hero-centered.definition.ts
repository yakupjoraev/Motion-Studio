import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { SURFACE_TOKENS, optionsFrom } from '../../scales'
import { HERO_COPY_CONTROLS, HERO_FRAME_CONTROLS, HERO_TRUST_CONTROL } from '../hero.controls'

import { heroCenteredMotion } from './hero-centered.motion'
import { heroCenteredSchema } from './hero-centered.schema'

export const heroCenteredDefinition = defineBlock({
  id: blockId('hero-centered'),
  name: 'Hero — centred',
  description: 'A centred headline stack with a CTA pair and an optional trust row.',
  category: 'hero',
  tags: ['hero', 'landing', 'headline', 'cta'],
  icon: 'hero',

  propsSchema: heroCenteredSchema,
  defaults: heroCenteredSchema.parse({}),
  previewProps: heroCenteredSchema.parse({ minHeight: 'auto', padding: 'lg' }),

  slots: [],

  controls: [
    { id: 'content', label: 'Content', controls: [...HERO_COPY_CONTROLS, HERO_TRUST_CONTROL] },
    { id: 'layout', label: 'Layout', controls: HERO_FRAME_CONTROLS },
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
          path: 'glow',
          kind: 'switch',
          label: 'Accent glow',
          hint: 'A soft accent field behind the headline',
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

  defaultMotion: heroCenteredMotion,

  codegen: { tag: 'section' },

  a11y: {
    notes: [
      'Renders the page’s single <h1>. Two heroes on one page is two h1 elements, which is a document with two titles.',
      'The glow is decorative: aria-hidden, no content, and rendered after the copy so it can never become the largest painted element.',
      'A button with no link is a <button>; one with a link is an <a>. Enter and Space behave differently, and the element is what tells a keyboard user which it is.',
    ],
  },
})
