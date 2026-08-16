import { z } from 'zod'

import { effectIntensity, effectSpeed, effectTint } from '../shared'

export const BEAM_BORDER_WIDTH = { min: 1, max: 4, step: 0.5, unit: 'px' } as const
export const BEAM_ARC = { min: 10, max: 180, step: 5, unit: '°' } as const

export const borderBeamSchema = z.object({
  tint: effectTint.default('accent'),
  intensity: effectIntensity.default(0.9),
  speed: effectSpeed.default(1),
  borderWidth: z.number().min(BEAM_BORDER_WIDTH.min).max(BEAM_BORDER_WIDTH.max).default(1.5),
  /** How much of the ring is lit. A short arc reads as a comet, a long one as a rotating gradient. */
  arc: z.number().min(BEAM_ARC.min).max(BEAM_ARC.max).default(40),
})
