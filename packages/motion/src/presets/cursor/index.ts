import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import type { ListenerSpec, MotionPreset } from '../../model/preset.types'
import { DISABLED, colorControl, sliderControl } from '../shared'

/**
 * Every cursor preset subscribes to the one pointer bus and writes **custom properties only** — never
 * a variant, never a property another channel could want. That is the whole reason the cursor channel
 * composes with everything (ADR-140), and it is why a pointer move costs no React render.
 */
const POINTER: readonly ListenerSpec[] = [{ event: 'pointerMove', variant: 'rest' }]

/** A radial light that follows the cursor across a surface. */
export const spotlight = definePreset({
  id: 'spotlight',
  name: 'Spotlight',
  channel: 'cursor',
  engine: 'css',
  paramsSchema: z.object({
    radius: z.number().min(40).max(800).default(240),
    intensity: z.number().min(0).max(1).default(0.35),
    color: z.string().default('var(--ms-color-accent)'),
  }),
  defaults: { radius: 240, intensity: 0.35, color: 'var(--ms-color-accent)' },
  controls: [
    sliderControl('radius', 'Radius', 40, 800, { step: 10, unit: 'px' }),
    sliderControl('intensity', 'Intensity', 0, 1, { step: 0.05 }),
    colorControl('color', 'Colour'),
  ],
  capabilities: { composableWith: ['entrance', 'hover', 'scroll', 'continuous'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'css',
    className: 'ms-spotlight',
    cssVars: {
      '--ms-cursor-x': '50%',
      '--ms-cursor-y': '50%',
      '--ms-spotlight-radius': `${params.radius}px`,
      '--ms-spotlight-intensity': String(params.intensity),
      '--ms-spotlight-color': params.color,
    },
    listeners: POINTER,
    keyframes:
      '.ms-spotlight { background-image: radial-gradient(var(--ms-spotlight-radius) circle at var(--ms-cursor-x) var(--ms-cursor-y), color-mix(in oklab, var(--ms-spotlight-color) calc(var(--ms-spotlight-intensity) * 100%), transparent), transparent 70%) }',
  }),
  /** § Reduced motion: the cursor channel is disabled entirely. */
  resolveReduced: () => DISABLED,
  codegen: (params) => ({
    imports: [{ from: 'react', named: ['useRef'] }],
    hooks: ['const spotlightRef = useRef<HTMLDivElement>(null)'],
    wrapper: {
      tag: 'div',
      props: {
        ref: '{spotlightRef}',
        className: '"ms-spotlight"',
        onPointerMove: `{(event) => {
  const element = spotlightRef.current
  if (element === null) return
  const box = element.getBoundingClientRect()
  element.style.setProperty('--ms-cursor-x', \`\${event.clientX - box.left}px\`)
  element.style.setProperty('--ms-cursor-y', \`\${event.clientY - box.top}px\`)
}}`,
      },
    },
    css: `.ms-spotlight { background-image: radial-gradient(${params.radius}px circle at var(--ms-cursor-x, 50%) var(--ms-cursor-y, 50%), color-mix(in oklab, ${params.color} ${Math.round(params.intensity * 100)}%, transparent), transparent 70%) }`,
  }),
})

/** A satellite that trails the pointer with a lag, drawn by the page rather than by the OS cursor. */
export const cursorFollow = definePreset({
  id: 'cursor-follow',
  name: 'Cursor follow',
  channel: 'cursor',
  engine: 'css',
  paramsSchema: z.object({
    lag: z.number().min(0).max(1).default(0.18),
    size: z.number().min(4).max(120).default(28),
  }),
  defaults: { lag: 0.18, size: 28 },
  controls: [
    sliderControl('lag', 'Lag', 0, 1, { step: 0.02 }),
    sliderControl('size', 'Size', 4, 120, { unit: 'px' }),
  ],
  capabilities: { composableWith: ['entrance', 'hover', 'scroll', 'continuous'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'css',
    className: 'ms-cursor-follow',
    cssVars: {
      '--ms-cursor-x': '0px',
      '--ms-cursor-y': '0px',
      '--ms-cursor-lag': String(params.lag),
      '--ms-cursor-size': `${params.size}px`,
    },
    listeners: POINTER,
    keyframes:
      '.ms-cursor-follow { position: fixed; width: var(--ms-cursor-size); height: var(--ms-cursor-size); translate: calc(var(--ms-cursor-x) - var(--ms-cursor-size) / 2) calc(var(--ms-cursor-y) - var(--ms-cursor-size) / 2); pointer-events: none }',
  }),
  resolveReduced: () => DISABLED,
  codegen: (params) => ({
    imports: [],
    classNames: ['ms-cursor-follow'],
    css: `.ms-cursor-follow { position: fixed; width: ${params.size}px; height: ${params.size}px; pointer-events: none; transition: translate ${Math.round(params.lag * 600)}ms ease-out }`,
  }),
})

/** A blurred blob under the cursor — the same tracking, a softer mark. */
export const cursorGlow = definePreset({
  id: 'cursor-glow',
  name: 'Cursor glow',
  channel: 'cursor',
  engine: 'css',
  paramsSchema: z.object({
    size: z.number().min(20).max(400).default(160),
    blur: z.number().min(0).max(120).default(48),
    opacity: z.number().min(0).max(1).default(0.4),
  }),
  defaults: { size: 160, blur: 48, opacity: 0.4 },
  controls: [
    sliderControl('size', 'Size', 20, 400, { step: 5, unit: 'px' }),
    sliderControl('blur', 'Blur', 0, 120, { unit: 'px' }),
    sliderControl('opacity', 'Opacity', 0, 1, { step: 0.05 }),
  ],
  capabilities: {
    composableWith: ['entrance', 'hover', 'scroll', 'continuous'],
    gpuHeavy: true,
    cost: 'moderate',
  },
  resolve: (params) => ({
    engine: 'css',
    className: 'ms-cursor-glow',
    cssVars: {
      '--ms-cursor-x': '50%',
      '--ms-cursor-y': '50%',
      '--ms-glow-size': `${params.size}px`,
      '--ms-glow-blur': `${params.blur}px`,
      '--ms-glow-opacity': String(params.opacity),
    },
    listeners: POINTER,
    keyframes:
      '.ms-cursor-glow::before { content: ""; position: absolute; width: var(--ms-glow-size); height: var(--ms-glow-size); left: var(--ms-cursor-x); top: var(--ms-cursor-y); translate: -50% -50%; filter: blur(var(--ms-glow-blur)); opacity: var(--ms-glow-opacity); background: var(--ms-color-accent); border-radius: 50%; pointer-events: none }',
  }),
  resolveReduced: () => DISABLED,
  codegen: (params) => ({
    imports: [],
    classNames: ['ms-cursor-glow'],
    css: `.ms-cursor-glow::before { width: ${params.size}px; height: ${params.size}px; filter: blur(${params.blur}px); opacity: ${params.opacity} }`,
  }),
})

/** The gradient's origin tracks the pointer, so the surface lights from wherever the reader is. */
export const gradientFollow = definePreset({
  id: 'gradient-follow',
  name: 'Gradient follow',
  channel: 'cursor',
  engine: 'css',
  paramsSchema: z.object({ spread: z.number().min(10).max(200).default(80) }),
  defaults: { spread: 80 },
  controls: [sliderControl('spread', 'Spread', 10, 200, { step: 5, unit: '%' })],
  capabilities: { composableWith: ['entrance', 'hover', 'scroll', 'continuous'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'css',
    className: 'ms-gradient-follow',
    cssVars: {
      '--ms-cursor-x': '50%',
      '--ms-cursor-y': '50%',
      '--ms-gradient-spread': `${params.spread}%`,
    },
    listeners: POINTER,
    keyframes:
      '.ms-gradient-follow { background-image: radial-gradient(var(--ms-gradient-spread) var(--ms-gradient-spread) at var(--ms-cursor-x) var(--ms-cursor-y), var(--ms-color-accent), transparent) }',
  }),
  resolveReduced: () => DISABLED,
  codegen: (params) => ({
    imports: [],
    classNames: ['ms-gradient-follow'],
    css: `.ms-gradient-follow { background-image: radial-gradient(${params.spread}% ${params.spread}% at var(--ms-cursor-x, 50%) var(--ms-cursor-y, 50%), var(--ms-color-accent), transparent) }`,
  }),
})

/** A hidden layer showing through a circular mask that the cursor carries. */
export const maskReveal = definePreset({
  id: 'mask-reveal',
  name: 'Mask reveal',
  channel: 'cursor',
  engine: 'css',
  paramsSchema: z.object({
    radius: z.number().min(20).max(500).default(140),
    feather: z.number().min(0).max(100).default(30),
  }),
  defaults: { radius: 140, feather: 30 },
  controls: [
    sliderControl('radius', 'Radius', 20, 500, { step: 5, unit: 'px' }),
    sliderControl('feather', 'Feather', 0, 100, { unit: '%' }),
  ],
  capabilities: { composableWith: ['entrance', 'hover', 'scroll', 'continuous'], cost: 'moderate' },
  resolve: (params) => ({
    engine: 'css',
    className: 'ms-mask-reveal',
    cssVars: {
      '--ms-cursor-x': '50%',
      '--ms-cursor-y': '50%',
      '--ms-mask-radius': `${params.radius}px`,
      '--ms-mask-feather': `${100 - params.feather}%`,
    },
    listeners: POINTER,
    keyframes:
      '.ms-mask-reveal { mask-image: radial-gradient(var(--ms-mask-radius) circle at var(--ms-cursor-x) var(--ms-cursor-y), black var(--ms-mask-feather), transparent) }',
  }),
  resolveReduced: () => DISABLED,
  codegen: (params) => ({
    imports: [],
    classNames: ['ms-mask-reveal'],
    css: `.ms-mask-reveal { mask-image: radial-gradient(${params.radius}px circle at var(--ms-cursor-x, 50%) var(--ms-cursor-y, 50%), black ${100 - params.feather}%, transparent) }`,
  }),
})

/** ANIMATION_SYSTEM.md § Cursor, in the order the document lists it. */
export const CURSOR_PRESETS: readonly MotionPreset[] = [
  spotlight,
  cursorFollow,
  cursorGlow,
  gradientFollow,
  maskReveal,
]
