import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import type { ListenerSpec } from '../../model/preset.types'
import { selectControl, sliderControl } from '../shared'

/** Every scroll preset reads the one shared bus; none of them opens a listener of its own. */
export const ON_SCROLL: readonly ListenerSpec[] = [{ event: 'scroll', variant: 'end' }]

const AXES = ['x', 'y'] as const

/**
 * Y offset driven by scroll progress. The offset is written as a custom property from the shared bus,
 * so the element moves without a render and without a second scroll listener.
 */
export const parallax = definePreset({
  id: 'parallax',
  name: 'Parallax',
  channel: 'scroll',
  engine: 'css',
  paramsSchema: z.object({
    speed: z.number().min(-1).max(1).default(0.3),
    axis: z.enum(AXES).default('y'),
    clamp: z.boolean().default(true),
  }),
  defaults: { speed: 0.3, axis: 'y', clamp: true },
  controls: [
    sliderControl('speed', 'Speed', -1, 1, { step: 0.05 }),
    selectControl(
      'axis',
      'Axis',
      AXES.map((value) => ({ value, label: value })),
    ),
  ],
  capabilities: { composableWith: ['hover', 'cursor'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'css',
    className: 'ms-parallax',
    properties: ['transform'],
    cssVars: {
      '--ms-parallax-speed': String(params.speed),
      '--ms-parallax-axis': params.axis,
      '--ms-parallax-offset': '0px',
    },
    transition: { duration: 0 },
    listeners: ON_SCROLL,
    keyframes: `.ms-parallax { transform: translate3d(${params.axis === 'x' ? 'var(--ms-parallax-offset), 0' : '0, var(--ms-parallax-offset)'}, 0) }`,
  }),
  /** § Reduced motion, scroll: the end state, standing still. Here that is no offset at all. */
  resolveReduced: () => ({
    engine: 'css',
    variants: { end: { y: 0 } },
    transition: { duration: 0 },
  }),
  codegen: (params) => ({
    imports: [{ from: 'motion/react', named: ['motion', 'useScroll', 'useTransform'] }],
    hooks: [
      'const { scrollYProgress } = useScroll()',
      `const parallaxOffset = useTransform(scrollYProgress, [0, 1], [0, ${Math.round(params.speed * -400)}])`,
    ],
    wrapper: {
      tag: 'motion.div',
      props: { style: `{{ ${params.axis}: parallaxOffset }}` },
    },
  }),
})

/** Opacity across a window of the scroll range, for anything that should arrive and then leave. */
export const scrollFade = definePreset({
  id: 'scroll-fade',
  name: 'Scroll fade',
  channel: 'scroll',
  engine: 'css',
  paramsSchema: z.object({
    start: z.number().min(0).max(1).default(0),
    end: z.number().min(0).max(1).default(0.4),
  }),
  defaults: { start: 0, end: 0.4 },
  controls: [
    sliderControl('start', 'Start', 0, 1, { step: 0.05 }),
    sliderControl('end', 'End', 0, 1, { step: 0.05 }),
  ],
  capabilities: { composableWith: ['hover', 'cursor'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'css',
    className: 'ms-scroll-fade',
    properties: ['opacity'],
    cssVars: {
      '--ms-scroll-start': String(params.start),
      '--ms-scroll-end': String(params.end),
      '--ms-scroll-progress': '0',
    },
    transition: { duration: 0 },
    listeners: ON_SCROLL,
    keyframes:
      '.ms-scroll-fade { opacity: clamp(0, calc((var(--ms-scroll-progress) - var(--ms-scroll-start)) / (var(--ms-scroll-end) - var(--ms-scroll-start))), 1) }',
  }),
  resolveReduced: () => ({
    engine: 'css',
    variants: { end: { opacity: 1 } },
    transition: { duration: 0 },
  }),
  codegen: (params) => ({
    imports: [{ from: 'motion/react', named: ['motion', 'useScroll', 'useTransform'] }],
    hooks: [
      'const { scrollYProgress } = useScroll()',
      `const scrollFadeOpacity = useTransform(scrollYProgress, [${params.start}, ${params.end}], [0, 1])`,
    ],
    wrapper: { tag: 'motion.div', props: { style: '{{ opacity: scrollFadeOpacity }}' } },
  }),
})

/** Scale across the same window; `from` may exceed `to`, which is how a shrink is written. */
export const scrollScale = definePreset({
  id: 'scroll-scale',
  name: 'Scroll scale',
  channel: 'scroll',
  engine: 'css',
  paramsSchema: z.object({
    from: z.number().min(0.5).max(1.5).default(0.9),
    to: z.number().min(0.5).max(1.5).default(1),
  }),
  defaults: { from: 0.9, to: 1 },
  controls: [
    sliderControl('from', 'From', 0.5, 1.5, { step: 0.01 }),
    sliderControl('to', 'To', 0.5, 1.5, { step: 0.01 }),
  ],
  capabilities: { composableWith: ['hover', 'cursor'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'css',
    className: 'ms-scroll-scale',
    properties: ['transform'],
    cssVars: {
      '--ms-scroll-from': String(params.from),
      '--ms-scroll-to': String(params.to),
      '--ms-scroll-progress': '0',
    },
    transition: { duration: 0 },
    listeners: ON_SCROLL,
    keyframes:
      '.ms-scroll-scale { transform: scale(calc(var(--ms-scroll-from) + (var(--ms-scroll-to) - var(--ms-scroll-from)) * var(--ms-scroll-progress))) }',
  }),
  resolveReduced: (params) => ({
    engine: 'css',
    variants: { end: { scale: params.to } },
    transition: { duration: 0 },
  }),
  codegen: (params) => ({
    imports: [{ from: 'motion/react', named: ['motion', 'useScroll', 'useTransform'] }],
    hooks: [
      'const { scrollYProgress } = useScroll()',
      `const scrollScaleValue = useTransform(scrollYProgress, [0, 1], [${params.from}, ${params.to}])`,
    ],
    wrapper: { tag: 'motion.div', props: { style: '{{ scale: scrollScaleValue }}' } },
  }),
})

/** Rotation across the scroll range — the same mechanism, one property along. */
export const scrollRotate = definePreset({
  id: 'scroll-rotate',
  name: 'Scroll rotate',
  channel: 'scroll',
  engine: 'css',
  paramsSchema: z.object({ degrees: z.number().min(-360).max(360).default(24) }),
  defaults: { degrees: 24 },
  controls: [sliderControl('degrees', 'Degrees', -360, 360, { unit: '°' })],
  capabilities: { composableWith: ['hover', 'cursor'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'css',
    className: 'ms-scroll-rotate',
    properties: ['transform'],
    cssVars: {
      '--ms-scroll-degrees': `${params.degrees}deg`,
      '--ms-scroll-progress': '0',
    },
    transition: { duration: 0 },
    listeners: ON_SCROLL,
    keyframes:
      '.ms-scroll-rotate { transform: rotate(calc(var(--ms-scroll-degrees) * var(--ms-scroll-progress))) }',
  }),
  resolveReduced: (params) => ({
    engine: 'css',
    variants: { end: { rotate: params.degrees } },
    transition: { duration: 0 },
  }),
  codegen: (params) => ({
    imports: [{ from: 'motion/react', named: ['motion', 'useScroll', 'useTransform'] }],
    hooks: [
      'const { scrollYProgress } = useScroll()',
      `const scrollRotation = useTransform(scrollYProgress, [0, 1], [0, ${params.degrees}])`,
    ],
    wrapper: { tag: 'motion.div', props: { style: '{{ rotate: scrollRotation }}' } },
  }),
})

/** The reading-progress bar. Width from the page's own progress, so it belongs to the page, not a node. */
export const progressBar = definePreset({
  id: 'progress-bar',
  name: 'Progress bar',
  channel: 'scroll',
  engine: 'css',
  paramsSchema: z.object({ axis: z.enum(AXES).default('x') }),
  defaults: { axis: 'x' },
  controls: [
    selectControl(
      'axis',
      'Axis',
      AXES.map((value) => ({ value, label: value })),
    ),
  ],
  capabilities: { composableWith: ['hover', 'cursor'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'css',
    className: 'ms-progress',
    properties: ['transform'],
    cssVars: { '--ms-scroll-progress': '0' },
    transition: { duration: 0 },
    listeners: ON_SCROLL,
    keyframes: `.ms-progress { transform-origin: ${params.axis === 'x' ? 'left center' : 'center top'}; transform: ${params.axis === 'x' ? 'scaleX' : 'scaleY'}(var(--ms-scroll-progress)) }`,
  }),
  /** A progress bar that does not track progress is a full bar, which is the honest end state. */
  resolveReduced: () => ({
    engine: 'css',
    variants: { end: { scaleX: 1 } },
    transition: { duration: 0 },
  }),
  codegen: (params) => ({
    imports: [{ from: 'motion/react', named: ['motion', 'useScroll'] }],
    hooks: ['const { scrollYProgress } = useScroll()'],
    wrapper: {
      tag: 'motion.div',
      props: {
        style: `{{ ${params.axis === 'x' ? 'scaleX' : 'scaleY'}: scrollYProgress, transformOrigin: '${params.axis === 'x' ? 'left' : 'top'}' }}`,
      },
    },
  }),
})
