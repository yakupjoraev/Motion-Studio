import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import {
  FLASH_SAFE_MIN_MS,
  HOVER_LISTENERS,
  colorControl,
  durationControl,
  durationSchema,
  easingNameSchema,
  selectControl,
  sliderControl,
  springControl,
  springNameSchema,
  timing,
} from '../shared'

/** The accent bloom a card grows under the pointer. Paint only, so it survives reduced motion whole. */
export const glowHover = definePreset({
  id: 'glow-hover',
  name: 'Glow',
  channel: 'hover',
  engine: 'css',
  paramsSchema: z.object({
    size: z.number().min(0).max(80).default(28),
    intensity: z.number().min(0).max(1).default(0.45),
    color: z.string().default('var(--ms-color-accent)'),
    duration: durationSchema(200, 0, 1000),
    easing: easingNameSchema.default('standard'),
  }),
  defaults: {
    size: 28,
    intensity: 0.45,
    color: 'var(--ms-color-accent)',
    duration: 200,
    easing: 'standard',
  },
  controls: [
    sliderControl('size', 'Size', 0, 80, { unit: 'px' }),
    sliderControl('intensity', 'Intensity', 0, 1, { step: 0.05 }),
    colorControl('color', 'Colour'),
    durationControl('duration', 'Duration', 0, 1000),
  ],
  capabilities: { composableWith: ['entrance', 'cursor', 'scroll'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'css',
    variants: {
      rest: { boxShadow: '0 0 0 0 transparent' },
      hover: {
        boxShadow: `0 0 ${params.size}px color-mix(in oklab, ${params.color} ${Math.round(params.intensity * 100)}%, transparent)`,
      },
    },
    transition: timing(params),
    listeners: HOVER_LISTENERS,
  }),
  /** Shadow is what the policy keeps, so the reduced glow is the glow. */
  resolveReduced: (params) => ({
    engine: 'css',
    variants: {
      rest: { boxShadow: '0 0 0 0 transparent' },
      hover: {
        boxShadow: `0 0 ${params.size}px color-mix(in oklab, ${params.color} ${Math.round(params.intensity * 100)}%, transparent)`,
      },
    },
    transition: { duration: params.duration },
    listeners: HOVER_LISTENERS,
  }),
  codegen: (params) => ({
    imports: [],
    classNames: ['ms-glow'],
    css: `.ms-glow { transition: box-shadow ${params.duration}ms ease }
.ms-glow:hover { box-shadow: 0 0 ${params.size}px color-mix(in oklab, ${params.color} ${Math.round(params.intensity * 100)}%, transparent) }`,
  }),
})

/** A gradient border that travels the perimeter while the pointer is on the card. */
export const borderBeam = definePreset({
  id: 'border-beam',
  name: 'Border beam',
  channel: 'hover',
  engine: 'css',
  paramsSchema: z.object({
    duration: durationSchema(2400, FLASH_SAFE_MIN_MS, 8000),
    width: z.number().min(1).max(6).default(2),
    color: z.string().default('var(--ms-color-accent)'),
  }),
  defaults: { duration: 2400, width: 2, color: 'var(--ms-color-accent)' },
  controls: [
    durationControl('duration', 'Duration', FLASH_SAFE_MIN_MS, 8000),
    sliderControl('width', 'Width', 1, 6, { unit: 'px' }),
    colorControl('color', 'Colour'),
  ],
  capabilities: { composableWith: ['entrance', 'cursor'], gpuHeavy: true, cost: 'moderate' },
  resolve: (params) => ({
    engine: 'css',
    className: 'ms-border-beam',
    properties: ['backgroundPosition'],
    cssVars: {
      '--ms-beam-width': `${params.width}px`,
      '--ms-beam-color': params.color,
      '--ms-beam-duration': `${params.duration}ms`,
    },
    transition: { duration: params.duration, repeat: 'infinite' },
    listeners: HOVER_LISTENERS,
    keyframes: `@keyframes ms-border-beam { to { --ms-beam-angle: 360deg } }
@property --ms-beam-angle { syntax: '<angle>'; initial-value: 0deg; inherits: false }
.ms-border-beam { border: var(--ms-beam-width) solid transparent; background-image: conic-gradient(from var(--ms-beam-angle), transparent 70%, var(--ms-beam-color)); background-origin: border-box; background-clip: border-box }
.ms-border-beam:hover { animation: ms-border-beam var(--ms-beam-duration) linear infinite }`,
  }),
  resolveReduced: () => ({ engine: 'css' }),
  codegen: (params) => ({
    imports: [],
    classNames: ['ms-border-beam'],
    css: `@property --ms-beam-angle { syntax: '<angle>'; initial-value: 0deg; inherits: false }
@keyframes ms-border-beam { to { --ms-beam-angle: 360deg } }
.ms-border-beam:hover { animation: ms-border-beam ${params.duration}ms linear infinite }`,
  }),
})

/** A specular sweep across the surface — one pass per hover, not a loop, so it never flashes. */
export const shine = definePreset({
  id: 'shine',
  name: 'Shine',
  channel: 'hover',
  engine: 'css',
  paramsSchema: z.object({
    angle: z.number().min(0).max(180).default(105),
    duration: durationSchema(700, 200, 3000),
  }),
  defaults: { angle: 105, duration: 700 },
  controls: [
    sliderControl('angle', 'Angle', 0, 180, { unit: '°' }),
    durationControl('duration', 'Duration', 200, 3000),
  ],
  capabilities: { composableWith: ['entrance', 'cursor'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'css',
    className: 'ms-shine',
    properties: ['backgroundPosition'],
    cssVars: {
      '--ms-shine-angle': `${params.angle}deg`,
      '--ms-shine-duration': `${params.duration}ms`,
    },
    transition: { duration: params.duration },
    listeners: HOVER_LISTENERS,
    keyframes: `@keyframes ms-shine { from { background-position: -150% 0 } to { background-position: 250% 0 } }
.ms-shine { background-image: linear-gradient(var(--ms-shine-angle), transparent 40%, rgb(255 255 255 / 0.25) 50%, transparent 60%); background-size: 250% 100%; background-repeat: no-repeat }
.ms-shine:hover { animation: ms-shine var(--ms-shine-duration) ease-out 1 }`,
  }),
  resolveReduced: () => ({ engine: 'css' }),
  codegen: (params) => ({
    imports: [],
    classNames: ['ms-shine'],
    css: `@keyframes ms-shine { from { background-position: -150% 0 } to { background-position: 250% 0 } }
.ms-shine:hover { animation: ms-shine ${params.duration}ms ease-out 1 }`,
  }),
})

const ORIGINS = ['left', 'center', 'right'] as const

/** The underline that grows from where the reader's eye already is. */
export const underlineGrow = definePreset({
  id: 'underline-grow',
  name: 'Underline grow',
  channel: 'hover',
  engine: 'css',
  paramsSchema: z.object({
    origin: z.enum(ORIGINS).default('left'),
    thickness: z.number().min(1).max(6).default(2),
    duration: durationSchema(200, 0, 1000),
  }),
  defaults: { origin: 'left', thickness: 2, duration: 200 },
  controls: [
    selectControl(
      'origin',
      'Origin',
      ORIGINS.map((value) => ({ value, label: value })),
    ),
    sliderControl('thickness', 'Thickness', 1, 6, { unit: 'px' }),
    durationControl('duration', 'Duration', 0, 1000),
  ],
  capabilities: { composableWith: ['entrance', 'cursor'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'css',
    className: 'ms-underline',
    properties: ['transform'],
    cssVars: {
      '--ms-underline-origin': params.origin,
      '--ms-underline-thickness': `${params.thickness}px`,
      '--ms-underline-duration': `${params.duration}ms`,
    },
    transition: { duration: params.duration },
    listeners: HOVER_LISTENERS,
    keyframes: `.ms-underline { position: relative }
.ms-underline::after { content: ''; position: absolute; inset-inline: 0; bottom: -2px; height: var(--ms-underline-thickness); background: currentColor; transform: scaleX(0); transform-origin: var(--ms-underline-origin); transition: transform var(--ms-underline-duration) ease }
.ms-underline:hover::after { transform: scaleX(1) }`,
  }),
  resolveReduced: () => ({ engine: 'css' }),
  codegen: (params) => ({
    imports: [],
    classNames: ['ms-underline'],
    css: `.ms-underline::after { transform: scaleX(0); transform-origin: ${params.origin}; transition: transform ${params.duration}ms ease }
.ms-underline:hover::after { transform: scaleX(1) }`,
  }),
})

const DIRECTIONS = ['up', 'down', 'left', 'right'] as const

/** Two icons, one slot: the resting one leaves as the hovered one arrives from the same direction. */
export const iconSwap = definePreset({
  id: 'icon-swap',
  name: 'Icon swap',
  channel: 'hover',
  engine: 'motion',
  paramsSchema: z.object({
    direction: z.enum(DIRECTIONS).default('up'),
    distance: z.number().min(4).max(48).default(16),
    spring: springNameSchema.default('snappy'),
  }),
  defaults: { direction: 'up', distance: 16, spring: 'snappy' },
  controls: [
    selectControl(
      'direction',
      'Direction',
      DIRECTIONS.map((value) => ({ value, label: value })),
    ),
    sliderControl('distance', 'Distance', 4, 48, { unit: 'px' }),
    springControl(),
  ],
  capabilities: { composableWith: ['entrance'], requiresChildren: true, cost: 'cheap' },
  resolve: (params) => {
    const axis = params.direction === 'left' || params.direction === 'right' ? 'x' : 'y'
    const sign = params.direction === 'up' || params.direction === 'left' ? -1 : 1

    return {
      engine: 'motion',
      variants: {
        rest: { [axis]: 0, opacity: 1 },
        hover: { [axis]: params.distance * sign, opacity: 0 },
      },
      transition: timing({ spring: params.spring }),
      listeners: HOVER_LISTENERS,
    }
  },
  resolveReduced: () => ({ engine: 'motion' }),
  codegen: (params) => ({
    imports: [{ from: 'motion/react', named: ['motion'] }],
    wrapper: {
      tag: 'motion.span',
      props: {
        whileHover: `{{ ${params.direction === 'left' || params.direction === 'right' ? 'x' : 'y'}: ${params.direction === 'up' || params.direction === 'left' ? -params.distance : params.distance}, opacity: 0 }}`,
      },
    },
  }),
})
