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
  sliderControl,
  timing,
} from '../shared'

/**
 * ANIMATION_SYSTEM.md § GPU discipline: blur is the most expensive thing in the catalogue, so the
 * maximum is the 12 px the document names, it runs on entrance only, and it is marked `moderate` so
 * the inspector warns before it lands on a row of twelve cards.
 */
export const blurIn = definePreset({
  id: 'blur-in',
  name: 'Blur in',
  channel: 'entrance',
  engine: 'motion',
  paramsSchema: z.object({
    blur: z.number().min(0).max(12).default(12),
    duration: durationSchema(700),
    delay: delaySchema(),
    easing: easingNameSchema.default('expoOut'),
  }),
  defaults: { blur: 12, duration: 700, delay: 0, easing: 'expoOut' },
  controls: [
    sliderControl('blur', 'Blur', 0, 12, { unit: 'px' }),
    durationControl('duration'),
    durationControl('delay', 'Delay'),
    easingControl(),
  ],
  capabilities: { composableWith: ['hover'], gpuHeavy: true, cost: 'moderate' },
  resolve: (params) => ({
    engine: 'motion',
    variants: {
      hidden: { opacity: 0, filter: `blur(${params.blur}px)` },
      visible: { opacity: 1, filter: 'blur(0px)' },
    },
    transition: timing(params),
    listeners: IN_VIEW,
  }),
  resolveReduced: () => REDUCED_ENTRANCE,
  codegen: (params) =>
    motionFragment({
      name: 'blurIn',
      variants: {
        hidden: { opacity: 0, filter: `blur(${params.blur}px)` },
        visible: { opacity: 1, filter: 'blur(0px)' },
      },
      transition: { duration: params.duration / 1000, delay: params.delay / 1000 },
    }),
})
