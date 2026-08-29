import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import { helper, sliderControl, switchControl } from '../shared'

import { ON_SCROLL } from './progress'

/**
 * **GSAP, two of exactly three.**
 *
 * `horizontal-scroll` pins a section and converts vertical scrolling into horizontal travel across a
 * track. Motion cannot pin: `useScroll` reports progress, but holding an element in place while the
 * page scrolls past it — and releasing it at the exact end of the track — is `ScrollTrigger`'s
 * `pin` plus `scrub`, and there is no equivalent. Native sticky cannot express it either, because the
 * track is wider than the viewport and the release point depends on that width.
 */
export const horizontalScroll = definePreset({
  id: 'horizontal-scroll',
  name: 'Horizontal scroll',
  channel: 'scroll',
  engine: 'gsap',
  paramsSchema: z.object({
    distance: z.number().min(200).max(6000).default(1600),
    snap: z.boolean().default(false),
  }),
  defaults: { distance: 1600, snap: false },
  controls: [
    sliderControl('distance', 'Distance', 200, 6000, { step: 50, unit: 'px' }),
    switchControl('snap', 'Snap'),
  ],
  capabilities: { composableWith: ['hover', 'cursor'], requiresChildren: true, cost: 'heavy' },
  resolve: (params) => ({
    engine: 'gsap',
    variants: { start: { x: 0 }, end: { x: -params.distance } },
    transition: { duration: 0 },
    listeners: ON_SCROLL,
  }),
  /** The track, at its start, scrollable by hand. No pinning and no scrub. */
  resolveReduced: () => ({
    engine: 'gsap',
    variants: { end: { x: 0 } },
    transition: { duration: 0 },
  }),
  codegen: (params) => ({
    imports: [
      { from: 'gsap', default: 'gsap' },
      { from: 'gsap/ScrollTrigger', named: ['ScrollTrigger'] },
      { from: 'react', named: ['useEffect', 'useRef'] },
    ],
    helpers: [helper('registerScrollTrigger', 'gsap.registerPlugin(ScrollTrigger)')],
    hooks: [
      'const trackRef = useRef<HTMLElement | null>(null)',
      `useEffect(() => {
  const track = trackRef.current
  if (track === null) return
  const tween = gsap.to(track, {
    x: -${params.distance},
    ease: 'none',
    scrollTrigger: {
      trigger: track.parentElement,
      pin: true,
      scrub: 1,
      end: '+=${params.distance}',${params.snap ? '\n      snap: 1 / (track.children.length - 1),' : ''}
    },
  })
  return () => { tween.scrollTrigger?.kill(); tween.kill() }
}, [])`,
    ],
    wrapper: { tag: 'div', props: { ref: '{(node) => { trackRef.current = node }}' } },
  }),
})

/**
 * **GSAP, three of exactly three.**
 *
 * `scroll-timeline` scrubs a multi-keyframe sequence — several elements, several properties, phases
 * that overlap — against scroll progress. Motion's `useTransform` maps one value to one output; a
 * timeline with labels, overlapping tweens and per-step easing is `gsap.timeline()`, and rebuilding
 * it from `useTransform` would be reimplementing the timeline.
 */
export const scrollTimeline = definePreset({
  id: 'scroll-timeline',
  name: 'Scroll timeline',
  channel: 'scroll',
  engine: 'gsap',
  paramsSchema: z.object({
    keyframes: z.string().min(1).default('0:opacity=0|0.5:opacity=1|1:y=-40'),
    scrub: z.number().min(0).max(3).default(1),
  }),
  defaults: { keyframes: '0:opacity=0|0.5:opacity=1|1:y=-40', scrub: 1 },
  controls: [sliderControl('scrub', 'Scrub', 0, 3, { step: 0.1, unit: 's' })],
  capabilities: { composableWith: ['hover', 'cursor'], cost: 'heavy' },
  resolve: (params) => ({
    engine: 'gsap',
    variants: keyframeVariants(params.keyframes),
    transition: { duration: 0 },
    listeners: ON_SCROLL,
  }),
  /**
   * Every keyframe folded together, applied at once — the state the sequence was heading towards.
   * The last stop alone is not it: a timeline that fades in and then lifts ends up visible *and*
   * lifted, and taking only the lift would leave the element at the opacity the first stop set.
   */
  resolveReduced: (params) => {
    const merged: Record<string, number | string> = {}

    for (const stop of Object.values(keyframeVariants(params.keyframes))) {
      Object.assign(merged, stop)
    }

    return {
      engine: 'gsap',
      ...(Object.keys(merged).length === 0 ? {} : { variants: { end: merged } }),
      transition: { duration: 0 },
    }
  },
  codegen: (params) => ({
    imports: [
      { from: 'gsap', default: 'gsap' },
      { from: 'gsap/ScrollTrigger', named: ['ScrollTrigger'] },
      { from: 'react', named: ['useEffect', 'useRef'] },
    ],
    helpers: [helper('registerScrollTrigger', 'gsap.registerPlugin(ScrollTrigger)')],
    hooks: [
      'const timelineRef = useRef<HTMLElement | null>(null)',
      `useEffect(() => {
  const element = timelineRef.current
  if (element === null) return
  const timeline = gsap.timeline({
    scrollTrigger: { trigger: element, scrub: ${params.scrub}, start: 'top bottom', end: 'bottom top' },
  })
${keyframeSteps(params.keyframes)}
  return () => { timeline.scrollTrigger?.kill(); timeline.kill() }
}, [])`,
    ],
    wrapper: { tag: 'div', props: { ref: '{(node) => { timelineRef.current = node }}' } },
  }),
})

/** `0:opacity=0|0.5:opacity=1` → one variant per stop, named by its position in the scroll range. */
function keyframeVariants(source: string): Record<string, Record<string, number | string>> {
  const variants: Record<string, Record<string, number | string>> = {}

  for (const step of source.split('|')) {
    const [at, assignment] = step.split(':')
    const [property, value] = (assignment ?? '').split('=')

    if (at === undefined || property === undefined || value === undefined) {
      continue
    }

    variants[`at-${at}`] = { [property]: Number.isNaN(Number(value)) ? value : Number(value) }
  }

  return variants
}

const keyframeSteps = (source: string): string =>
  Object.entries(keyframeVariants(source))
    .map(([name, target]) => `  timeline.to(element, ${JSON.stringify(target)}) // ${name}`)
    .join('\n')
