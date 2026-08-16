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

/**
 * The grain layer moves so the texture does not read as a static pattern. It translates rather than
 * regenerating: an animated `feTurbulence` is a full-surface filter every frame, which is the most
 * expensive way to say the same thing.
 */
export const noiseShift = definePreset({
  id: 'noise-shift',
  name: 'Noise shift',
  channel: 'continuous',
  engine: 'css',
  paramsSchema: z.object({
    speed: durationSchema(1600, FLASH_SAFE_MIN_MS, 8000),
    amount: z.number().min(0).max(1).default(0.35),
  }),
  defaults: { speed: 1600, amount: 0.35 },
  controls: [
    durationControl('speed', 'Period', FLASH_SAFE_MIN_MS, 8000),
    sliderControl('amount', 'Amount', 0, 1, { step: 0.05 }),
  ],
  capabilities: { composableWith: ['entrance', 'hover', 'cursor'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'css',
    className: 'ms-noise',
    properties: ['transform', 'opacity'],
    cssVars: {
      '--ms-noise-speed': `${params.speed}ms`,
      '--ms-noise-amount': String(params.amount),
    },
    transition: { duration: params.speed, repeat: 'infinite' },
    listeners: ALWAYS,
    keyframes: `@keyframes ms-noise { 25% { transform: translate3d(-2%, 1%, 0) } 50% { transform: translate3d(1%, -2%, 0) } 75% { transform: translate3d(2%, 2%, 0) } }
.ms-noise { opacity: var(--ms-noise-amount); animation: ms-noise var(--ms-noise-speed) steps(4, end) infinite }`,
  }),
  resolveReduced: () => DISABLED,
  codegen: (params) => ({
    imports: [],
    classNames: ['ms-noise'],
    css: `@keyframes ms-noise { 25% { transform: translate3d(-2%, 1%, 0) } 50% { transform: translate3d(1%, -2%, 0) } 75% { transform: translate3d(2%, 2%, 0) } }
.ms-noise { opacity: ${params.amount}; animation: ms-noise ${params.speed}ms steps(4, end) infinite }`,
  }),
})
