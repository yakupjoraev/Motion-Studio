import { z } from 'zod'

import { effectIntensity, effectSpeed, effectTint } from '../shared'

export const BEAM_COUNT = { min: 1, max: 6, step: 1 } as const
export const BEAM_WIDTH = { min: 8, max: 160, step: 4, unit: 'px' } as const
export const BEAM_ANGLE = { min: -60, max: 60, step: 1, unit: '°' } as const

export const beamsSchema = z.object({
  tint: effectTint.default('accent'),
  intensity: effectIntensity.default(0.35),
  speed: effectSpeed.default(0.8),
  /** Six is the cap because a seventh is never legible: they overlap into a wash. */
  count: z.number().int().min(BEAM_COUNT.min).max(BEAM_COUNT.max).default(3),
  width: z.number().min(BEAM_WIDTH.min).max(BEAM_WIDTH.max).default(64),
  angle: z.number().min(BEAM_ANGLE.min).max(BEAM_ANGLE.max).default(-18),
})
