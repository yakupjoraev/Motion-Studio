import { z } from 'zod'

import { effectIntensity, effectSpeed } from '../shared'

export const GRAIN_SCALE = { min: 64, max: 512, step: 8, unit: 'px' } as const

export const GRAIN_BLENDS = ['overlay', 'soft-light'] as const

export type GrainBlend = (typeof GRAIN_BLENDS)[number]

export const grainOverlaySchema = z.object({
  intensity: effectIntensity.default(0.18),
  scale: z.number().min(GRAIN_SCALE.min).max(GRAIN_SCALE.max).default(160),
  /**
   * Capped at 3 by `effectSpeed`, which is what keeps the eight-step cycle under 3 Hz — the
   * accessibility limit this effect is the only one in the category at risk of crossing.
   */
  speed: effectSpeed.default(1),
  blend: z.enum(GRAIN_BLENDS).default('overlay'),
})
