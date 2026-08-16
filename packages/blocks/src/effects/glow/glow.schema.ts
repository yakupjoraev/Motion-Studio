import { z } from 'zod'

import { effectIntensity, effectSpeed, effectTint } from '../shared'

export const GLOW_BLUR = { min: 16, max: 200, step: 4, unit: 'px' } as const

export const GLOW_ORIGINS = ['center', 'top', 'bottom', 'left', 'right'] as const

export type GlowOrigin = (typeof GLOW_ORIGINS)[number]

export const glowSchema = z.object({
  tint: effectTint.default('accent'),
  intensity: effectIntensity.default(0.4),
  blur: z.number().min(GLOW_BLUR.min).max(GLOW_BLUR.max).default(96),
  origin: z.enum(GLOW_ORIGINS).default('bottom'),
  /** A slow swell rather than a pulse: anything faster reads as an alert. */
  breathe: z.boolean().default(false),
  speed: effectSpeed.default(0.5),
})
