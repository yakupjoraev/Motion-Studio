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

/**
 * The perspective belongs to the parent, not to the rotating element: a `rotateX` with its own
 * `perspective` rotates in a box of its own and reads flat. The resolution therefore writes the
 * custom property the wrapper's stylesheet applies, and the rotation goes on the element.
 */
export const flipIn = definePreset({
  id: 'flip-in',
  name: 'Flip in',
  channel: 'entrance',
  engine: 'motion',
  paramsSchema: z.object({
    angle: z.number().min(-90).max(90).default(-24),
    perspective: z.number().min(200).max(2000).default(800),
    spring: springNameSchema.default('smooth'),
    delay: delaySchema(),
  }),
  defaults: { angle: -24, perspective: 800, spring: 'smooth', delay: 0 },
  controls: [
    sliderControl('angle', 'Angle', -90, 90, { unit: '°' }),
    sliderControl('perspective', 'Perspective', 200, 2000, { step: 20, unit: 'px' }),
    springControl(),
    durationControl('delay', 'Delay'),
  ],
  capabilities: { composableWith: ['hover'], cost: 'moderate' },
  resolve: (params) => ({
    engine: 'motion',
    variants: {
      hidden: { opacity: 0, rotateX: params.angle },
      visible: { opacity: 1, rotateX: 0 },
    },
    transition: timing({ spring: params.spring, delay: params.delay }),
    cssVars: { '--ms-motion-perspective': `${params.perspective}px` },
    listeners: IN_VIEW,
  }),
  resolveReduced: () => REDUCED_ENTRANCE,
  codegen: (params) =>
    motionFragment({
      name: 'flipIn',
      variants: {
        hidden: { opacity: 0, rotateX: params.angle },
        visible: { opacity: 1, rotateX: 0 },
      },
      transition: { type: 'spring', ...SPRINGS[params.spring], delay: params.delay / 1000 },
    }),
})
