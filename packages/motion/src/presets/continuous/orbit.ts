import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import { DISABLED, durationControl, durationSchema, sliderControl } from '../shared'

import { ALWAYS } from './float'

/**
 * Children circle a centre. Each child carries its own delay — a fraction of the period times its
 * index — so one keyframe animation and `animation-delay` place all of them, and the browser never
 * has to interpolate a path.
 */
export const orbit = definePreset({
  id: 'orbit',
  name: 'Orbit',
  channel: 'continuous',
  engine: 'css',
  paramsSchema: z.object({
    radius: z.number().min(20).max(320).default(120),
    duration: durationSchema(14000, 2000, 60000),
    count: z.number().min(1).max(12).default(3),
  }),
  defaults: { radius: 120, duration: 14000, count: 3 },
  controls: [
    sliderControl('radius', 'Radius', 20, 320, { unit: 'px' }),
    durationControl('duration', 'Duration', 2000, 60000),
    sliderControl('count', 'Count', 1, 12),
  ],
  capabilities: {
    composableWith: ['entrance', 'cursor'],
    requiresChildren: true,
    gpuHeavy: true,
    cost: 'moderate',
  },
  resolve: (params) => ({
    engine: 'css',
    className: 'ms-orbit',
    properties: ['transform'],
    cssVars: {
      '--ms-orbit-radius': `${params.radius}px`,
      '--ms-orbit-duration': `${params.duration}ms`,
      '--ms-orbit-count': String(params.count),
    },
    transition: { duration: params.duration, repeat: 'infinite' },
    listeners: ALWAYS,
    keyframes: `@keyframes ms-orbit { to { transform: rotate(360deg) translateX(var(--ms-orbit-radius)) rotate(-360deg) } }
.ms-orbit > * { animation: ms-orbit var(--ms-orbit-duration) linear infinite; animation-delay: calc(var(--ms-orbit-duration) / var(--ms-orbit-count) * var(--ms-orbit-index, 0) * -1) }`,
  }),
  resolveReduced: () => DISABLED,
  codegen: (params) => ({
    imports: [],
    classNames: ['ms-orbit'],
    css: `@keyframes ms-orbit { to { transform: rotate(360deg) translateX(${params.radius}px) rotate(-360deg) } }
.ms-orbit > * { animation: ms-orbit ${params.duration}ms linear infinite }`,
  }),
})
