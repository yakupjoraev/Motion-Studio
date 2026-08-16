import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import {
  DISABLED,
  FLASH_SAFE_MIN_MS,
  durationControl,
  durationSchema,
  sliderControl,
} from '../shared'

import { ALWAYS } from './float'

/** A light beam crossing a surface on a loop. One gradient, one background position, no layers. */
export const beam = definePreset({
  id: 'beam',
  name: 'Beam',
  channel: 'continuous',
  engine: 'css',
  paramsSchema: z.object({
    duration: durationSchema(3200, FLASH_SAFE_MIN_MS, 12000),
    angle: z.number().min(0).max(180).default(115),
    width: z.number().min(4).max(60).default(18),
  }),
  defaults: { duration: 3200, angle: 115, width: 18 },
  controls: [
    durationControl('duration', 'Duration', FLASH_SAFE_MIN_MS, 12000),
    sliderControl('angle', 'Angle', 0, 180, { unit: '°' }),
    sliderControl('width', 'Width', 4, 60, { unit: '%' }),
  ],
  capabilities: { composableWith: ['entrance', 'hover', 'cursor'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'css',
    className: 'ms-beam',
    properties: ['backgroundPosition'],
    cssVars: {
      '--ms-beam-duration': `${params.duration}ms`,
      '--ms-beam-angle': `${params.angle}deg`,
      '--ms-beam-width': `${params.width}%`,
    },
    transition: { duration: params.duration, repeat: 'infinite' },
    listeners: ALWAYS,
    keyframes: `@keyframes ms-beam { from { background-position: -120% 0 } to { background-position: 220% 0 } }
.ms-beam { background-image: linear-gradient(var(--ms-beam-angle), transparent calc(50% - var(--ms-beam-width)), rgb(255 255 255 / 0.22) 50%, transparent calc(50% + var(--ms-beam-width))); background-size: 220% 100%; background-repeat: no-repeat; animation: ms-beam var(--ms-beam-duration) linear infinite }`,
  }),
  resolveReduced: () => DISABLED,
  codegen: (params) => ({
    imports: [],
    classNames: ['ms-beam'],
    css: `@keyframes ms-beam { from { background-position: -120% 0 } to { background-position: 220% 0 } }
.ms-beam { animation: ms-beam ${params.duration}ms linear infinite }`,
  }),
})
