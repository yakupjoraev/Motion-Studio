import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import {
  IN_VIEW,
  REDUCED_ENTRANCE,
  delaySchema,
  durationControl,
  durationSchema,
  easingControl,
  easingNameSchema,
  motionFragment,
  timing,
} from '../shared'

/** The one every other entrance is a variation of: opacity, and nothing that moves. */
export const fade = definePreset({
  id: 'fade',
  name: 'Fade',
  channel: 'entrance',
  engine: 'motion',
  paramsSchema: z.object({
    duration: durationSchema(600),
    delay: delaySchema(),
    easing: easingNameSchema.default('expoOut'),
  }),
  defaults: { duration: 600, delay: 0, easing: 'expoOut' },
  controls: [durationControl('duration'), durationControl('delay', 'Delay'), easingControl()],
  capabilities: { composableWith: ['hover', 'cursor', 'continuous'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'motion',
    variants: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
    transition: timing(params),
    listeners: IN_VIEW,
  }),
  // Already opacity-only; the policy's 120 ms is what the resolver applies over it.
  resolveReduced: () => REDUCED_ENTRANCE,
  codegen: (params) =>
    motionFragment({
      name: 'fade',
      variants: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
      transition: { duration: params.duration / 1000, delay: params.delay / 1000 },
    }),
})
