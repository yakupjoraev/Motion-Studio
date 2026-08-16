import { z } from 'zod'

import { effectIntensity, effectSpeed, effectTint } from '../shared'

export const PARTICLE_COUNT = { min: 4, max: 80, step: 1 } as const
export const PARTICLE_SIZE = { min: 1, max: 8, step: 0.5, unit: 'px' } as const

export const particlesSchema = z.object({
  tint: effectTint.default('accent'),
  intensity: effectIntensity.default(0.5),
  speed: effectSpeed.default(0.6),
  /** Eighty is the cap: past that the field reads as noise and the element count starts to matter. */
  count: z.number().int().min(PARTICLE_COUNT.min).max(PARTICLE_COUNT.max).default(28),
  size: z.number().min(PARTICLE_SIZE.min).max(PARTICLE_SIZE.max).default(2),
  /** The seed is a prop, so the same document always renders the same field — never `Math.random`. */
  seed: z.number().int().min(0).max(9999).default(7),
})
