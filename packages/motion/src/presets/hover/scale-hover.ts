import { z } from 'zod'

import { SPRINGS } from '../../curves/springs'
import { definePreset } from '../../model/define-preset'
import { HOVER_LISTENERS, sliderControl, springControl, springNameSchema, timing } from '../shared'

/** Scale on a spring, which is the only shape that makes a pointer-driven size change feel physical. */
export const scaleHover = definePreset({
  id: 'scale-hover',
  name: 'Scale',
  channel: 'hover',
  engine: 'motion',
  paramsSchema: z.object({
    scale: z.number().min(1).max(1.3).default(1.04),
    spring: springNameSchema.default('snappy'),
  }),
  defaults: { scale: 1.04, spring: 'snappy' },
  controls: [sliderControl('scale', 'Scale', 1, 1.3, { step: 0.01 }), springControl()],
  capabilities: { composableWith: ['entrance', 'cursor', 'scroll'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'motion',
    variants: { rest: { scale: 1 }, hover: { scale: params.scale } },
    transition: timing({ spring: params.spring }),
    listeners: HOVER_LISTENERS,
  }),
  /** Nothing but the shadow survives a reduced hover, and this preset has none — so it stands still. */
  resolveReduced: () => ({ engine: 'motion' }),
  codegen: (params) => ({
    imports: [{ from: 'motion/react', named: ['motion'] }],
    wrapper: {
      tag: 'motion.div',
      props: {
        whileHover: `{{ scale: ${params.scale} }}`,
        transition: `{${JSON.stringify({ type: 'spring', ...SPRINGS[params.spring] })}}`,
      },
    },
  }),
})
