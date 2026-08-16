import { z } from 'zod'

import { effectIntensity, effectSpeed, effectTint } from '../shared'

export const AURORA_BLUR = { min: 24, max: 160, step: 4, unit: 'px' } as const

export const auroraBackgroundSchema = z.object({
  tint: effectTint.default('accent'),
  /** A second hue is what makes it an aurora rather than a glow: the fields interfere. */
  secondaryTint: effectTint.default('info'),
  intensity: effectIntensity.default(0.45),
  speed: effectSpeed.default(1),
  blur: z.number().min(AURORA_BLUR.min).max(AURORA_BLUR.max).default(80),
  /** Gradient banding is visible on a wide blurred field; a noise layer at low opacity hides it. */
  grain: z.boolean().default(true),
  /**
   * A wash of the surface colour over the fields. Measured on the thumbnail stage: without it, body
   * copy over a bright field reads at roughly 2:1 and the effect is unusable behind the text it is
   * meant to sit behind. On by default for that reason; off is for a decorative band with no copy.
   */
  scrim: z.boolean().default(true),
})
