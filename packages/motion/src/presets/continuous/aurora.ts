import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import { DISABLED, colorControl, durationControl, durationSchema, sliderControl } from '../shared'

import { ALWAYS } from './float'

/**
 * The drift `hero-aurora` is built around, as a preset any surface can take. Pure CSS: a blurred
 * field on a long period, alternating rather than looping, so the composition never visibly repeats.
 *
 * `gpuHeavy`, because a large blurred layer is exactly what § GPU discipline caps at three instances.
 */
export const aurora = definePreset({
  id: 'aurora',
  name: 'Aurora',
  channel: 'continuous',
  engine: 'css',
  paramsSchema: z.object({
    speed: durationSchema(27000, 4000, 60000),
    blur: z.number().min(20).max(160).default(80),
    color: z.string().default('var(--ms-color-accent)'),
  }),
  defaults: { speed: 27000, blur: 80, color: 'var(--ms-color-accent)' },
  controls: [
    durationControl('speed', 'Period', 4000, 60000),
    sliderControl('blur', 'Blur', 20, 160, { unit: 'px' }),
    colorControl('color', 'Colour'),
  ],
  capabilities: {
    composableWith: ['entrance', 'hover', 'cursor'],
    gpuHeavy: true,
    cost: 'moderate',
  },
  resolve: (params) => ({
    engine: 'css',
    className: 'ms-aurora',
    properties: ['transform', 'filter'],
    cssVars: {
      '--ms-aurora-speed': `${params.speed}ms`,
      '--ms-aurora-blur': `${params.blur}px`,
      '--ms-aurora-color': params.color,
    },
    transition: { duration: params.speed, repeat: 'infinite', repeatType: 'mirror' },
    listeners: ALWAYS,
    keyframes: `@keyframes ms-aurora-drift { from { transform: translate3d(-6%, 0, 0) rotate(0deg) } to { transform: translate3d(6%, 4%, 0) rotate(8deg) } }
.ms-aurora { filter: blur(var(--ms-aurora-blur)); background: radial-gradient(60% 60% at 30% 30%, var(--ms-aurora-color), transparent 70%); animation: ms-aurora-drift var(--ms-aurora-speed) ease-in-out infinite alternate }`,
  }),
  resolveReduced: () => DISABLED,
  codegen: (params) => ({
    imports: [],
    classNames: ['ms-aurora'],
    css: `@keyframes ms-aurora-drift { to { transform: translate3d(6%, 4%, 0) rotate(8deg) } }
.ms-aurora { filter: blur(${params.blur}px); animation: ms-aurora-drift ${params.speed}ms ease-in-out infinite alternate }`,
  }),
})
