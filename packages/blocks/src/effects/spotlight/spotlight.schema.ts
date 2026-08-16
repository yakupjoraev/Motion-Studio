import { z } from 'zod'

import { effectIntensity, effectTint } from '../shared'

export const SPOTLIGHT_REACH = { min: 10, max: 90, step: 1, unit: '%' } as const

export const spotlightSchema = z.object({
  tint: effectTint.default('accent'),
  intensity: effectIntensity.default(0.3),
  /** How far the light carries before it is gone. Small reaches read as a torch, wide ones as a wash. */
  reach: z.number().min(SPOTLIGHT_REACH.min).max(SPOTLIGHT_REACH.max).default(40),
  /** Off pins the light to the centre, which is also what happens with no pointer and under reduced motion. */
  followPointer: z.boolean().default(true),
})
