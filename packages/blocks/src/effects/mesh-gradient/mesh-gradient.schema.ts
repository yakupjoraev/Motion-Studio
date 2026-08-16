import { z } from 'zod'

import { effectIntensity, effectSpeed, effectTint } from '../shared'

export const MESH_BLUR = { min: 0, max: 160, step: 4, unit: 'px' } as const
export const MESH_SPREAD = { min: 20, max: 90, step: 1, unit: '%' } as const

export const meshGradientSchema = z.object({
  tint: effectTint.default('accent'),
  secondaryTint: effectTint.default('info'),
  tertiaryTint: effectTint.default('success'),
  intensity: effectIntensity.default(0.55),
  speed: effectSpeed.default(0.6),
  blur: z.number().min(MESH_BLUR.min).max(MESH_BLUR.max).default(40),
  /** How far each stop reaches before it fades out. Small spreads read as spots, wide ones as haze. */
  spread: z.number().min(MESH_SPREAD.min).max(MESH_SPREAD.max).default(55),
  /** The same wash the aurora carries, for the same measured reason: text in front has to stay legible. */
  scrim: z.boolean().default(true),
})
