import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import { HOVER_LISTENERS, sliderControl, springControl, springNameSchema, timing } from '../shared'

/** Border-radius morph with a slight skew — the "soft body" hover, held together by a spring. */
export const liquid = definePreset({
  id: 'liquid',
  name: 'Liquid',
  channel: 'hover',
  engine: 'motion',
  paramsSchema: z.object({
    intensity: z.number().min(0).max(1).default(0.5),
    spring: springNameSchema.default('wobbly'),
  }),
  defaults: { intensity: 0.5, spring: 'wobbly' },
  controls: [sliderControl('intensity', 'Intensity', 0, 1, { step: 0.05 }), springControl()],
  capabilities: { composableWith: ['entrance', 'cursor'], cost: 'moderate' },
  resolve: (params) => ({
    engine: 'motion',
    variants: {
      rest: { borderRadius: '16px', skewX: 0 },
      hover: {
        borderRadius: `${16 + params.intensity * 40}px ${16 + params.intensity * 12}px`,
        skewX: -params.intensity * 3,
      },
    },
    transition: timing({ spring: params.spring }),
    listeners: HOVER_LISTENERS,
  }),
  /** The skew is a transform, and a reduced hover keeps none — what remains is the resting shape. */
  resolveReduced: () => ({ engine: 'motion' }),
  codegen: (params) => ({
    imports: [{ from: 'motion/react', named: ['motion'] }],
    wrapper: {
      tag: 'motion.div',
      props: {
        whileHover: `{{ borderRadius: '${16 + params.intensity * 40}px ${16 + params.intensity * 12}px', skewX: ${-params.intensity * 3} }}`,
      },
    },
  }),
})
