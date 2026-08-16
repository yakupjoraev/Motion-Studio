import { z } from 'zod'

import { effectIntensity, effectTint } from '../shared'

export const DOT_SPACING = { min: 8, max: 96, step: 1, unit: 'px' } as const
export const DOT_SIZE = { min: 0.5, max: 4, step: 0.5, unit: 'px' } as const

export const dotGridSchema = z.object({
  tint: effectTint.default('foreground'),
  intensity: effectIntensity.default(0.12),
  spacing: z.number().min(DOT_SPACING.min).max(DOT_SPACING.max).default(24),
  dotSize: z.number().min(DOT_SIZE.min).max(DOT_SIZE.max).default(1.5),
  /** Without the fade the lattice runs to the edge and reads as graph paper rather than as texture. */
  fade: z.boolean().default(true),
})
