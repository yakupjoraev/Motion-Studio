import { z } from 'zod'

import { SPRINGS } from '../../curves/springs'
import { definePreset } from '../../model/define-preset'
import {
  IN_VIEW,
  REDUCED_ENTRANCE,
  delaySchema,
  durationControl,
  motionFragment,
  sliderControl,
  springControl,
  springNameSchema,
  timing,
} from '../shared'

/** Scale plus opacity, on a spring — the arrival a card wants, and the one a spring describes best. */
export const scaleIn = definePreset({
  id: 'scale-in',
  name: 'Scale in',
  channel: 'entrance',
  engine: 'motion',
  paramsSchema: z.object({
    from: z.number().min(0.5).max(1.5).default(0.92),
    spring: springNameSchema.default('snappy'),
    delay: delaySchema(),
  }),
  defaults: { from: 0.92, spring: 'snappy', delay: 0 },
  controls: [
    sliderControl('from', 'From', 0.5, 1.5, { step: 0.01 }),
    springControl(),
    durationControl('delay', 'Delay'),
  ],
  capabilities: { composableWith: ['hover', 'cursor'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'motion',
    variants: {
      hidden: { opacity: 0, scale: params.from },
      visible: { opacity: 1, scale: 1 },
    },
    transition: timing({ spring: params.spring, delay: params.delay }),
    listeners: IN_VIEW,
  }),
  resolveReduced: () => REDUCED_ENTRANCE,
  codegen: (params) =>
    motionFragment({
      name: 'scaleIn',
      variants: { hidden: { opacity: 0, scale: params.from }, visible: { opacity: 1, scale: 1 } },
      transition: { type: 'spring', ...SPRINGS[params.spring], delay: params.delay / 1000 },
    }),
})
