import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import { DISABLED, durationControl, durationSchema, sliderControl } from '../shared'

import { ALWAYS } from './float'

/** A gradient travelling its own background box — no transform, no promoted layer, almost no cost. */
export const gradientShift = definePreset({
  id: 'gradient-shift',
  name: 'Gradient shift',
  channel: 'continuous',
  engine: 'css',
  paramsSchema: z.object({
    duration: durationSchema(8000, 1000, 30000),
    angle: z.number().min(0).max(360).default(120),
  }),
  defaults: { duration: 8000, angle: 120 },
  controls: [
    durationControl('duration', 'Duration', 1000, 30000),
    sliderControl('angle', 'Angle', 0, 360, { unit: '°' }),
  ],
  capabilities: { composableWith: ['entrance', 'hover', 'cursor'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'css',
    className: 'ms-gradient-shift',
    properties: ['backgroundPosition'],
    cssVars: {
      '--ms-gradient-duration': `${params.duration}ms`,
      '--ms-gradient-angle': `${params.angle}deg`,
    },
    transition: { duration: params.duration, repeat: 'infinite' },
    listeners: ALWAYS,
    keyframes: `@keyframes ms-gradient-shift { to { background-position: 200% 50% } }
.ms-gradient-shift { background-size: 200% 200%; animation: ms-gradient-shift var(--ms-gradient-duration) linear infinite }`,
  }),
  resolveReduced: () => DISABLED,
  codegen: (params) => ({
    imports: [],
    classNames: ['ms-gradient-shift'],
    css: `@keyframes ms-gradient-shift { to { background-position: 200% 50% } }
.ms-gradient-shift { background-size: 200% 200%; animation: ms-gradient-shift ${params.duration}ms linear infinite }`,
  }),
})
