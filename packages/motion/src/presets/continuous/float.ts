import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import type { ListenerSpec } from '../../model/preset.types'
import {
  DISABLED,
  FLASH_SAFE_MIN_MS,
  durationControl,
  durationSchema,
  sliderControl,
} from '../shared'

/** Continuous presets tick on the shared frame loop, which stops them off screen and on tab hide. */
export const ALWAYS: readonly ListenerSpec[] = [{ event: 'frame', variant: 'loop' }]

/** A slow sinusoidal drift — the lightest thing in the catalogue and the one used most often. */
export const float = definePreset({
  id: 'float',
  name: 'Float',
  channel: 'continuous',
  engine: 'css',
  paramsSchema: z.object({
    distance: z.number().min(2).max(48).default(10),
    duration: durationSchema(4000, FLASH_SAFE_MIN_MS, 20000),
  }),
  defaults: { distance: 10, duration: 4000 },
  controls: [
    sliderControl('distance', 'Distance', 2, 48, { unit: 'px' }),
    durationControl('duration', 'Duration', FLASH_SAFE_MIN_MS, 20000),
  ],
  capabilities: { composableWith: ['entrance', 'hover', 'cursor'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'css',
    className: 'ms-float',
    properties: ['transform'],
    cssVars: {
      '--ms-float-distance': `${params.distance}px`,
      '--ms-float-duration': `${params.duration}ms`,
    },
    transition: { duration: params.duration, repeat: 'infinite', repeatType: 'mirror' },
    listeners: ALWAYS,
    keyframes: `@keyframes ms-float { 50% { transform: translate3d(0, calc(var(--ms-float-distance) * -1), 0) } }
.ms-float { animation: ms-float var(--ms-float-duration) ease-in-out infinite }`,
  }),
  /** § Reduced motion: continuous is disabled entirely, not slowed. */
  resolveReduced: () => DISABLED,
  codegen: (params) => ({
    imports: [],
    classNames: ['ms-float'],
    css: `@keyframes ms-float { 50% { transform: translateY(-${params.distance}px) } }
.ms-float { animation: ms-float ${params.duration}ms ease-in-out infinite }`,
  }),
})
