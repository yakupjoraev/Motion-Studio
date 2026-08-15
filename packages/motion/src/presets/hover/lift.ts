import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import {
  HOVER_LISTENERS,
  durationControl,
  durationSchema,
  easingNameSchema,
  sliderControl,
  timing,
} from '../shared'

const shadow = (depth: number): string => `0 ${depth}px ${depth * 3}px rgb(0 0 0 / 0.18)`

/** The card that rises under the pointer: a translate and a shadow that agrees with it. */
export const lift = definePreset({
  id: 'lift',
  name: 'Lift',
  channel: 'hover',
  engine: 'css',
  paramsSchema: z.object({
    distance: z.number().min(0).max(24).default(4),
    shadow: z.number().min(0).max(32).default(12),
    duration: durationSchema(180, 0, 1000),
    easing: easingNameSchema.default('standard'),
  }),
  defaults: { distance: 4, shadow: 12, duration: 180, easing: 'standard' },
  controls: [
    sliderControl('distance', 'Distance', 0, 24, { unit: 'px' }),
    sliderControl('shadow', 'Shadow', 0, 32, { unit: 'px' }),
    durationControl('duration', 'Duration', 0, 1000),
  ],
  capabilities: { composableWith: ['entrance', 'cursor', 'scroll'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'css',
    variants: {
      rest: { y: 0, boxShadow: shadow(0) },
      hover: { y: -params.distance, boxShadow: shadow(params.shadow) },
    },
    transition: timing(params),
    listeners: HOVER_LISTENERS,
  }),
  /** § Reduced motion, hover: colour and shadow only. The lift is exactly the part that goes. */
  resolveReduced: (params) => ({
    engine: 'css',
    variants: { rest: { boxShadow: shadow(0) }, hover: { boxShadow: shadow(params.shadow) } },
    transition: timing(params),
    listeners: HOVER_LISTENERS,
  }),
  codegen: (params) => ({
    imports: [],
    classNames: ['ms-lift'],
    css: `.ms-lift { transition: transform ${params.duration}ms var(--ms-ease-standard), box-shadow ${params.duration}ms var(--ms-ease-standard) }
.ms-lift:hover { transform: translateY(-${params.distance}px); box-shadow: ${shadow(params.shadow)} }`,
  }),
})
