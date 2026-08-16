import { z } from 'zod'

import { effectIntensity } from '../shared'

export const NOISE_SCALE = { min: 64, max: 512, step: 8, unit: 'px' } as const

export const NOISE_BLENDS = ['overlay', 'soft-light', 'multiply', 'screen'] as const

export type NoiseBlend = (typeof NOISE_BLENDS)[number]

export const noiseOverlaySchema = z.object({
  /** Low by default: noise is felt rather than seen, and 0.12 is where it stops being a texture swatch. */
  intensity: effectIntensity.default(0.12),
  /** The tile size. Larger tiles read as paper, smaller ones as sensor noise. */
  scale: z.number().min(NOISE_SCALE.min).max(NOISE_SCALE.max).default(180),
  /** Part of the technique rather than of the stack: which blend makes grain read as surface. */
  blend: z.enum(NOISE_BLENDS).default('overlay'),
})
