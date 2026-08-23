import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { optionsFrom } from '../../scales'
import { HERO_COPY_CONTROLS, HERO_FRAME_CONTROLS, HERO_TRUST_CONTROL } from '../hero.controls'

import { heroAuroraMotion } from './hero-aurora.motion'
import {
  AURORA_INTENSITIES,
  AURORA_NOISE,
  AURORA_PALETTES,
  heroAuroraSchema,
} from './hero-aurora.schema'

export const heroAuroraDefinition = defineBlock({
  id: blockId('hero-aurora'),
  name: 'Hero — aurora',
  description: 'A centred hero over a drifting aurora backdrop. Pure CSS.',
  category: 'hero',
  tags: ['hero', 'landing', 'gradient', 'aurora'],
  icon: 'wave',

  propsSchema: heroAuroraSchema,
  defaults: heroAuroraSchema.parse({}),
  previewProps: heroAuroraSchema.parse({ minHeight: 'auto', padding: 'lg', intensity: 'vivid' }),

  slots: [],

  controls: [
    { id: 'content', label: 'Content', controls: [...HERO_COPY_CONTROLS, HERO_TRUST_CONTROL] },
    { id: 'layout', label: 'Layout', controls: HERO_FRAME_CONTROLS },
    {
      id: 'style',
      label: 'Style',
      controls: [
        {
          path: 'palette',
          kind: 'select',
          label: 'Palette',
          options: { options: optionsFrom(AURORA_PALETTES) },
        },
        {
          path: 'intensity',
          kind: 'segmented',
          label: 'Intensity',
          options: { options: optionsFrom(AURORA_INTENSITIES) },
        },
        {
          path: 'noise',
          kind: 'select',
          label: 'Noise',
          hint: 'Hides the banding a large gradient shows on an 8-bit display',
          options: { options: optionsFrom(AURORA_NOISE) },
        },
        {
          path: 'drift',
          kind: 'switch',
          label: 'Drift',
          hint: 'Off is what reduced motion sees, so this is also how you preview it',
        },
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: true,
    // It *is* the backdrop. Nothing behind it is blurred, so nothing behind it is required.
    requiresBackdrop: false,
    supportsMotion: ['entrance', 'scroll'],
    costClass: 'moderate',
  },

  defaultMotion: heroAuroraMotion,

  codegen: {
    tag: 'section',
    client: {
      kind: 'never',
      reason: 'The aurora is a CSS animation on a decorative layer, so the section is markup.',
    },
  },

  a11y: {
    notes: [
      'The entire backdrop is aria-hidden and empty: a screen reader is told about a headline, not about three gradients.',
      'The drift stops under prefers-reduced-motion and under the studio’s own reduced preview, and the static composition is the one the block is designed around.',
      'The scrim is a surface token rather than black, so the same block holds text contrast in light mode and in dark.',
      'Nothing here flashes: the slowest field completes a cycle in roughly half a minute, far under the 3 Hz limit.',
    ],
  },
})
