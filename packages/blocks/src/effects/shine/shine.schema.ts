import { z } from 'zod'

import { effectIntensity, effectSpeed, effectTint } from '../shared'

export const SHINE_WIDTH = { min: 10, max: 80, step: 1, unit: '%' } as const
export const SHINE_ANGLE = { min: -45, max: 45, step: 1, unit: '°' } as const

export const shineSchema = z.object({
  tint: effectTint.default('foreground'),
  intensity: effectIntensity.default(0.25),
  speed: effectSpeed.default(1),
  width: z.number().min(SHINE_WIDTH.min).max(SHINE_WIDTH.max).default(40),
  angle: z.number().min(SHINE_ANGLE.min).max(SHINE_ANGLE.max).default(20),
})
