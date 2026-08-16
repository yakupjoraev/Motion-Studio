import { z } from 'zod'

import { effectIntensity, effectSpeed, effectTint } from '../shared'

export const SCANLINE_SPACING = { min: 2, max: 16, step: 1, unit: 'px' } as const
export const SCANLINE_WIDTH = { min: 0.5, max: 4, step: 0.5, unit: 'px' } as const

export const scanlinesSchema = z.object({
  tint: effectTint.default('foreground'),
  intensity: effectIntensity.default(0.08),
  speed: effectSpeed.default(0.5),
  spacing: z.number().min(SCANLINE_SPACING.min).max(SCANLINE_SPACING.max).default(4),
  lineWidth: z.number().min(SCANLINE_WIDTH.min).max(SCANLINE_WIDTH.max).default(1),
  /** Off is the safe default for anyone sensitive to motion in fine repeating patterns. */
  drift: z.boolean().default(false),
})
