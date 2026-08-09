import { z } from 'zod'

import { heroCopyFields, heroFrameFields, heroTrustField } from '../hero.schema'

/** Three semantic tokens each, so a palette follows the theme instead of pinning its own colours. */
export const AURORA_PALETTES = ['spectrum', 'ember', 'nordic'] as const

export type AuroraPalette = (typeof AURORA_PALETTES)[number]

export const AURORA_INTENSITIES = ['subtle', 'medium', 'vivid'] as const

export type AuroraIntensity = (typeof AURORA_INTENSITIES)[number]

/** DESIGN_SYSTEM.md § Noise and grain. `medium` is the last step that reads as grain on a light page. */
export const AURORA_NOISE = ['none', 'subtle', 'light', 'medium'] as const

export type AuroraNoise = (typeof AURORA_NOISE)[number]

export const heroAuroraSchema = z.object({
  ...heroCopyFields({
    eyebrow: 'Motion Studio',
    headline: 'Build the thing you keep sketching',
    subtitle:
      'An infinite canvas, a real component registry, and an export that reads like it was written by hand.',
    actions: [
      { label: 'Start building', href: '#', variant: 'primary' },
      { label: 'Watch the tour', href: '#', variant: 'secondary' },
    ],
  }),
  trust: heroTrustField([
    { label: 'Open source' },
    { label: 'Reduced-motion correct' },
    { label: 'Exports as CSS' },
  ]),
  ...heroFrameFields({ align: 'center', minHeight: 'three-quarters' }),
  palette: z.enum(AURORA_PALETTES).default('spectrum'),
  intensity: z.enum(AURORA_INTENSITIES).default('medium'),
  /**
   * The drift. Off leaves the static composition, which the block is designed to look finished in —
   * that is the same state reduced motion produces, so the switch is also how a user previews it.
   */
  drift: z.boolean().default(true),
  noise: z.enum(AURORA_NOISE).default('subtle'),
})

export type HeroAuroraProps = z.infer<typeof heroAuroraSchema>
