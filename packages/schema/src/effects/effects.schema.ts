import { z } from 'zod'

import { effectIdSchema, effectInstanceIdSchema } from '../ids/ids'

import { BLEND_MODES } from './effects.types'

export const blendModeSchema = z.enum(BLEND_MODES)

/** `params` is per-effect and validated by the effect's own schema in a second pass, like node props. */
export const effectInstanceSchema = z.object({
  id: effectInstanceIdSchema,
  effectId: effectIdSchema,
  params: z.record(z.unknown()).default({}),
  layer: z.enum(['behind', 'front']).default('behind'),
  blendMode: blendModeSchema.default('normal'),
  opacity: z.number().min(0).max(1).default(1),
})
