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

/**
 * `pathLength` is Motion's own normalisation of a stroke: 0 is an undrawn path and 1 is a whole one,
 * whatever the path's real length. The block underneath supplies the SVG; this preset supplies the
 * drawing.
 */
export const drawLine = definePreset({
  id: 'draw-line',
  name: 'Draw line',
  channel: 'entrance',
  engine: 'motion',
  paramsSchema: z.object({
    duration: durationSchema(900),
    delay: delaySchema(),
    easing: easingNameSchema.default('circOut'),
  }),
  defaults: { duration: 900, delay: 0, easing: 'circOut' },
  controls: [durationControl('duration'), durationControl('delay', 'Delay'), easingControl()],
  capabilities: { composableWith: ['hover', 'cursor'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'motion',
    variants: { hidden: { pathLength: 0, opacity: 0 }, visible: { pathLength: 1, opacity: 1 } },
    transition: timing(params),
    listeners: IN_VIEW,
  }),
  /** A line that appears whole is still the drawing's result; the drawing itself is the motion. */
  resolveReduced: () => REDUCED_ENTRANCE,
  codegen: (params) =>
    motionFragment({
      name: 'drawLine',
      variants: { hidden: { pathLength: 0, opacity: 0 }, visible: { pathLength: 1, opacity: 1 } },
      transition: { duration: params.duration / 1000, delay: params.delay / 1000 },
    }),
})
