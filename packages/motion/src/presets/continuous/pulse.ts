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
 * Scale and opacity breathing together. The minimum period is the flash-safety floor rather than a
 * matter of taste: a pulse at 200 ms is a strobe, and WCAG 2.3.1 is not a preference.
 */
export const pulse = definePreset({
  id: 'pulse',
  name: 'Pulse',
  channel: 'continuous',
  engine: 'css',
  paramsSchema: z.object({
    scale: z.number().min(1).max(1.4).default(1.06),
    duration: durationSchema(2400, FLASH_SAFE_MIN_MS, 12000),
  }),
  defaults: { scale: 1.06, duration: 2400 },
  controls: [
    sliderControl('scale', 'Scale', 1, 1.4, { step: 0.01 }),
    durationControl('duration', 'Duration', FLASH_SAFE_MIN_MS, 12000),
  ],
  capabilities: { composableWith: ['entrance', 'cursor'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'css',
    className: 'ms-pulse',
    properties: ['transform', 'opacity'],
    cssVars: {
      '--ms-pulse-scale': String(params.scale),
      '--ms-pulse-duration': `${params.duration}ms`,
    },
    transition: { duration: params.duration, repeat: 'infinite', repeatType: 'mirror' },
    listeners: ALWAYS,
    keyframes: `@keyframes ms-pulse { 50% { transform: scale(var(--ms-pulse-scale)); opacity: 0.82 } }
.ms-pulse { animation: ms-pulse var(--ms-pulse-duration) ease-in-out infinite }`,
  }),
  resolveReduced: () => DISABLED,
  codegen: (params) => ({
    imports: [],
    classNames: ['ms-pulse'],
    css: `@keyframes ms-pulse { 50% { transform: scale(${params.scale}); opacity: 0.82 } }
.ms-pulse { animation: ms-pulse ${params.duration}ms ease-in-out infinite }`,
  }),
})
