import { z } from 'zod'

import { CATALOGUE_ID_RE } from '../ids/ids'

/**
 * The same closed sets as `motion.types.ts`, declared twice on purpose and tied together by
 * `motion.test.ts` — the same arrangement `packages/theme` uses for `ThemeConfig`. Each half stays
 * readable on its own, and the test is what stops them drifting.
 */
export const motionChannelSchema = z.enum([
  'entrance',
  'scroll',
  'hover',
  'press',
  'cursor',
  'continuous',
  'exit',
])

export const motionTriggerSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('mount') }),
  z.object({
    kind: z.literal('inView'),
    amount: z.number().min(0).max(1),
    once: z.boolean(),
    margin: z.string().max(40),
  }),
  z.object({
    kind: z.literal('scrollProgress'),
    start: z.string().max(40),
    end: z.string().max(40),
  }),
  z.object({ kind: z.literal('hover') }),
  z.object({ kind: z.literal('press') }),
  z.object({ kind: z.literal('pointerMove'), within: z.enum(['element', 'viewport']) }),
  z.object({ kind: z.literal('always') }),
])

export const motionStaggerSchema = z.object({
  each: z.number().min(0).max(2000),
  from: z.enum(['first', 'last', 'center']),
})

/**
 * `params` is loose here for the same reason node `props` are: the parameter schema belongs to the
 * preset, which lives in `packages/motion`, and this package must not depend on it. A document with a
 * preset this build does not know still parses, so the import report can say which ones are new
 * instead of refusing the file.
 */
export const motionSpecSchema = z.object({
  presetId: z.string().regex(CATALOGUE_ID_RE),
  channel: motionChannelSchema,
  trigger: motionTriggerSchema,
  params: z.record(z.union([z.number(), z.string().max(200), z.boolean()])).default({}),
  stagger: motionStaggerSchema.optional(),
  disabled: z.boolean().optional(),
})
