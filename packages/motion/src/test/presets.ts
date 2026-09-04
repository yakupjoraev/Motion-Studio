import type { MotionChannel, MotionSpec, MotionTrigger } from '@motion-studio/schema'
import { z } from 'zod'

import { EASINGS } from '../curves/easings'
import { createPresetRegistry, definePreset } from '../model/define-preset'
import type { ResolveContext } from '../model/preset.types'

/**
 * The catalogue the model's tests resolve against. Prompt 32 writes the real one; these five exist to
 * cover the shapes composition has to reason about — two presets that share a property, two that do
 * not, one that writes only variables, and one that animates through a class.
 */
const distance = z.object({ distance: z.number().default(24) })

export const fadeUp = definePreset({
  id: 'fade-up',
  name: 'Fade up',
  channel: 'entrance',
  engine: 'motion',
  paramsSchema: distance,
  defaults: { distance: 24 },
  controls: [{ path: 'distance', kind: 'number', label: 'Distance' }],
  capabilities: { composableWith: ['hover', 'cursor'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'motion',
    variants: {
      hidden: { opacity: 0, y: params.distance },
      visible: { opacity: 1, y: 0 },
    },
    transition: { duration: 240, ease: EASINGS.decelerate },
    listeners: [{ event: 'inView', variant: 'visible' }],
  }),
  resolveReduced: () => ({
    engine: 'motion',
    variants: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
    transition: { duration: 240, ease: EASINGS.standard },
    listeners: [{ event: 'inView', variant: 'visible' }],
  }),
  codegen: () => ({ imports: [{ from: 'motion/react', named: ['motion'] }] }),
})

export const lift = definePreset({
  id: 'lift',
  name: 'Lift',
  channel: 'hover',
  engine: 'css',
  paramsSchema: distance,
  defaults: { distance: 4 },
  controls: [{ path: 'distance', kind: 'number', label: 'Distance' }],
  capabilities: { composableWith: ['entrance'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'css',
    variants: { rest: { y: 0 }, hover: { y: -params.distance } },
    transition: { duration: 180, ease: EASINGS.standard },
    listeners: [{ event: 'hover', variant: 'hover' }],
  }),
  resolveReduced: () => ({
    engine: 'css',
    variants: { rest: { boxShadow: 'none' }, hover: { boxShadow: '0 0 0 1px currentColor' } },
    transition: { duration: 180 },
  }),
  codegen: () => ({ imports: [], classNames: ['ms-lift'] }),
})

export const glow = definePreset({
  id: 'glow',
  name: 'Glow',
  channel: 'hover',
  engine: 'css',
  paramsSchema: z.object({ spread: z.number().default(12) }),
  defaults: { spread: 12 },
  controls: [{ path: 'spread', kind: 'number', label: 'Spread' }],
  capabilities: { composableWith: ['entrance', 'cursor'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'css',
    variants: {
      rest: { boxShadow: '0 0 0 0 transparent' },
      hover: { boxShadow: `0 0 ${params.spread}px currentColor` },
    },
    transition: { duration: 180, ease: EASINGS.standard },
  }),
  resolveReduced: (params) => ({
    engine: 'css',
    variants: {
      rest: { boxShadow: '0 0 0 0 transparent' },
      hover: { boxShadow: `0 0 ${params.spread}px currentColor` },
    },
    transition: { duration: 180 },
  }),
  codegen: () => ({ imports: [] }),
})

export const parallax = definePreset({
  id: 'parallax',
  name: 'Parallax',
  channel: 'scroll',
  engine: 'motion',
  paramsSchema: z.object({ distance: z.number().default(80) }),
  defaults: { distance: 80 },
  controls: [{ path: 'distance', kind: 'number', label: 'Distance' }],
  capabilities: { composableWith: ['cursor'], gpuHeavy: true, cost: 'moderate' },
  resolve: (params) => ({
    engine: 'motion',
    variants: { start: { y: 0 }, end: { y: -params.distance } },
    transition: { duration: 0 },
    listeners: [{ event: 'scroll', variant: 'end' }],
  }),
  resolveReduced: (params) => ({
    engine: 'motion',
    variants: { start: { y: 0 }, end: { y: -params.distance } },
    transition: { duration: 0 },
  }),
  codegen: () => ({ imports: [{ from: 'motion/react', named: ['motion'] }] }),
})

export const spotlight = definePreset({
  id: 'spotlight',
  name: 'Spotlight',
  channel: 'cursor',
  engine: 'css',
  paramsSchema: z.object({ radius: z.number().default(240) }),
  defaults: { radius: 240 },
  controls: [{ path: 'radius', kind: 'number', label: 'Radius' }],
  capabilities: { composableWith: ['entrance', 'hover', 'scroll'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'css',
    cssVars: { '--ms-spotlight-radius': `${params.radius}px` },
    listeners: [{ event: 'pointerMove', variant: 'rest' }],
  }),
  resolveReduced: () => ({ engine: 'css' }),
  codegen: () => ({ imports: [] }),
})

export const drift = definePreset({
  id: 'drift',
  name: 'Drift',
  channel: 'continuous',
  engine: 'css',
  paramsSchema: z.object({ seconds: z.number().default(12) }),
  defaults: { seconds: 12 },
  controls: [{ path: 'seconds', kind: 'number', label: 'Seconds' }],
  capabilities: { composableWith: ['hover'], gpuHeavy: true, cost: 'heavy' },
  // The class is the animation, so the properties it touches are declared rather than derivable.
  resolve: (params) => ({
    engine: 'css',
    className: 'ms-drift',
    keyframes: '@keyframes ms-drift { to { transform: translateY(-8px) } }',
    properties: ['transform'],
    transition: { duration: params.seconds * 1000, repeat: 'infinite' },
  }),
  resolveReduced: () => ({ engine: 'css' }),
  codegen: () => ({ imports: [] }),
})

export const registry = createPresetRegistry([fadeUp, lift, glow, parallax, spotlight, drift])

export const context = (overrides: Partial<ResolveContext> = {}): ResolveContext => ({
  reduced: false,
  scale: 1,
  presets: registry,
  ...overrides,
})

const TRIGGERS: Readonly<Record<MotionChannel, MotionTrigger>> = {
  entrance: { kind: 'inView', amount: 0.3, once: true, margin: '0px' },
  scroll: { kind: 'scrollProgress', start: 'top bottom', end: 'bottom top' },
  hover: { kind: 'hover' },
  press: { kind: 'press' },
  cursor: { kind: 'pointerMove', within: 'element' },
  continuous: { kind: 'always' },
  exit: { kind: 'mount' },
}

export function spec(
  presetId: string,
  channel: MotionChannel,
  params: Readonly<Record<string, number | string | boolean>> = {},
): MotionSpec {
  return { presetId, channel, trigger: TRIGGERS[channel], params }
}
