import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import type { MotionPreset, ResolvedMotion } from '../../model/preset.types'
import {
  durationControl,
  durationSchema,
  easingControl,
  easingNameSchema,
  motionFragment,
  selectControl,
  sliderControl,
  timing,
} from '../shared'

/**
 * Exits play through `AnimatePresence`, so the variant that matters is the one the element leaves
 * for. § Reduced motion makes the whole channel instant, which the policy applies over whatever these
 * return — an exit that is not seen is an exit that need not be animated.
 */
const INSTANT: ResolvedMotion = { engine: 'motion', transition: { duration: 0 } }

export const fadeOut = definePreset({
  id: 'fade-out',
  name: 'Fade out',
  channel: 'exit',
  engine: 'motion',
  paramsSchema: z.object({
    duration: durationSchema(240, 0, 2000),
    easing: easingNameSchema.default('accelerate'),
  }),
  defaults: { duration: 240, easing: 'accelerate' },
  controls: [durationControl('duration', 'Duration', 0, 2000), easingControl()],
  capabilities: { composableWith: ['hover'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'motion',
    variants: { visible: { opacity: 1 }, exit: { opacity: 0 } },
    transition: timing(params),
  }),
  resolveReduced: () => INSTANT,
  codegen: (params) =>
    motionFragment({
      name: 'fadeOut',
      variants: { visible: { opacity: 1 }, exit: { opacity: 0 } },
      transition: { duration: params.duration / 1000 },
      trigger: 'mount',
    }),
})

export const scaleOut = definePreset({
  id: 'scale-out',
  name: 'Scale out',
  channel: 'exit',
  engine: 'motion',
  paramsSchema: z.object({
    to: z.number().min(0.5).max(1.5).default(0.94),
    duration: durationSchema(220, 0, 2000),
    easing: easingNameSchema.default('accelerate'),
  }),
  defaults: { to: 0.94, duration: 220, easing: 'accelerate' },
  controls: [
    sliderControl('to', 'To', 0.5, 1.5, { step: 0.01 }),
    durationControl('duration', 'Duration', 0, 2000),
  ],
  capabilities: { composableWith: ['hover'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'motion',
    variants: { visible: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: params.to } },
    transition: timing(params),
  }),
  resolveReduced: () => INSTANT,
  codegen: (params) =>
    motionFragment({
      name: 'scaleOut',
      variants: { visible: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: params.to } },
      transition: { duration: params.duration / 1000 },
      trigger: 'mount',
    }),
})

const DIRECTIONS = ['up', 'down', 'left', 'right'] as const

export const slideOut = definePreset({
  id: 'slide-out',
  name: 'Slide out',
  channel: 'exit',
  engine: 'motion',
  paramsSchema: z.object({
    direction: z.enum(DIRECTIONS).default('down'),
    distance: z.number().min(0).max(200).default(24),
    duration: durationSchema(240, 0, 2000),
    easing: easingNameSchema.default('accelerate'),
  }),
  defaults: { direction: 'down', distance: 24, duration: 240, easing: 'accelerate' },
  controls: [
    selectControl(
      'direction',
      'Direction',
      DIRECTIONS.map((value) => ({ value, label: value })),
    ),
    sliderControl('distance', 'Distance', 0, 200, { unit: 'px' }),
    durationControl('duration', 'Duration', 0, 2000),
  ],
  capabilities: { composableWith: ['hover'], cost: 'cheap' },
  resolve: (params) => {
    const axis = params.direction === 'left' || params.direction === 'right' ? 'x' : 'y'
    const sign = params.direction === 'up' || params.direction === 'left' ? -1 : 1

    return {
      engine: 'motion',
      variants: {
        visible: { opacity: 1, [axis]: 0 },
        exit: { opacity: 0, [axis]: params.distance * sign },
      },
      transition: timing(params),
    }
  },
  resolveReduced: () => INSTANT,
  codegen: (params) =>
    motionFragment({
      name: 'slideOut',
      variants: {
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: params.direction === 'up' ? -params.distance : params.distance },
      },
      transition: { duration: params.duration / 1000 },
      trigger: 'mount',
    }),
})

export const blurOut = definePreset({
  id: 'blur-out',
  name: 'Blur out',
  channel: 'exit',
  engine: 'motion',
  paramsSchema: z.object({
    blur: z.number().min(0).max(12).default(8),
    duration: durationSchema(240, 0, 2000),
    easing: easingNameSchema.default('accelerate'),
  }),
  defaults: { blur: 8, duration: 240, easing: 'accelerate' },
  controls: [
    sliderControl('blur', 'Blur', 0, 12, { unit: 'px' }),
    durationControl('duration', 'Duration', 0, 2000),
  ],
  capabilities: { composableWith: ['hover'], gpuHeavy: true, cost: 'moderate' },
  resolve: (params) => ({
    engine: 'motion',
    variants: {
      visible: { opacity: 1, filter: 'blur(0px)' },
      exit: { opacity: 0, filter: `blur(${params.blur}px)` },
    },
    transition: timing(params),
  }),
  resolveReduced: () => INSTANT,
  codegen: (params) =>
    motionFragment({
      name: 'blurOut',
      variants: {
        visible: { opacity: 1, filter: 'blur(0px)' },
        exit: { opacity: 0, filter: `blur(${params.blur}px)` },
      },
      transition: { duration: params.duration / 1000 },
      trigger: 'mount',
    }),
})

/**
 * The one exit that animates a layout property, because collapsing *is* the layout: `height: auto`
 * to `0`. Motion measures the element and animates the number, which is the only way to express it
 * without the jump a `display: none` gives.
 */
export const collapse = definePreset({
  id: 'collapse',
  name: 'Collapse',
  channel: 'exit',
  engine: 'motion',
  paramsSchema: z.object({
    duration: durationSchema(260, 0, 2000),
    easing: easingNameSchema.default('standard'),
  }),
  defaults: { duration: 260, easing: 'standard' },
  controls: [durationControl('duration', 'Duration', 0, 2000), easingControl()],
  capabilities: { composableWith: ['hover'], cost: 'moderate' },
  resolve: (params) => ({
    engine: 'motion',
    variants: {
      visible: { height: 'auto', opacity: 1 },
      exit: { height: 0, opacity: 0 },
    },
    transition: timing(params),
  }),
  resolveReduced: () => INSTANT,
  codegen: (params) =>
    motionFragment({
      name: 'collapse',
      variants: { visible: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 } },
      transition: { duration: params.duration / 1000 },
      trigger: 'mount',
    }),
})

/** ANIMATION_SYSTEM.md § Exit, in the order the document lists it. */
export const EXIT_PRESETS: readonly MotionPreset[] = [
  fadeOut,
  scaleOut,
  slideOut,
  blurOut,
  collapse,
]
