import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import {
  IN_VIEW,
  REDUCED_ENTRANCE,
  durationControl,
  durationSchema,
  helper,
  selectControl,
  sliderControl,
} from '../shared'

const BY = ['line', 'word', 'char'] as const

/**
 * **GSAP, one of exactly three.** Motion cannot split text: `SplitText` measures the rendered lines,
 * rewraps them in per-line masks and re-measures on resize, and Motion has no equivalent — a
 * hand-rolled split loses the line boxes the moment the container changes width.
 *
 * The split must not cost the text its readability: the original string stays in `aria-label` on the
 * container and every generated span is `aria-hidden`, because a screen reader reading forty
 * one-character spans is a serious regression, not a cosmetic one.
 */
export const textReveal = definePreset({
  id: 'text-reveal',
  name: 'Text reveal',
  channel: 'entrance',
  engine: 'gsap',
  paramsSchema: z.object({
    by: z.enum(BY).default('line'),
    stagger: z.number().min(0).max(400).default(60),
    duration: durationSchema(700),
  }),
  defaults: { by: 'line', stagger: 60, duration: 700 },
  controls: [
    selectControl(
      'by',
      'Split by',
      BY.map((value) => ({ value, label: value })),
    ),
    sliderControl('stagger', 'Stagger', 0, 400, { step: 10, unit: 'ms' }),
    durationControl('duration'),
  ],
  capabilities: { composableWith: ['hover', 'cursor'], cost: 'moderate' },
  resolve: (params) => ({
    engine: 'gsap',
    variants: {
      hidden: { y: '110%', opacity: 0 },
      visible: { y: '0%', opacity: 1 },
    },
    transition: { duration: params.duration, stagger: { each: params.stagger, from: 'first' } },
    cssVars: { '--ms-text-split': params.by },
    listeners: IN_VIEW,
  }),
  /** The text, whole and still. The split itself is the motion, so there is nothing left to reduce. */
  resolveReduced: () => REDUCED_ENTRANCE,
  codegen: (params) => ({
    imports: [
      { from: 'gsap', default: 'gsap' },
      { from: 'gsap/SplitText', named: ['SplitText'] },
      { from: 'react', named: ['useEffect', 'useRef'] },
    ],
    helpers: [helper('registerSplitText', 'gsap.registerPlugin(SplitText)')],
    hooks: [
      'const splitRef = useRef<HTMLDivElement>(null)',
      `useEffect(() => {
  const element = splitRef.current
  if (element === null) return
  const split = new SplitText(element, { type: '${params.by}s', ${params.by}sClass: 'ms-split' })
  const tween = gsap.from(split.${params.by}s, {
    yPercent: 110,
    opacity: 0,
    duration: ${params.duration / 1000},
    stagger: ${params.stagger / 1000},
    scrollTrigger: { trigger: element, once: true },
  })
  return () => { tween.kill(); split.revert() }
}, [])`,
    ],
    // The accessible copy is the wrapper's own label; the split spans below it are hidden.
    wrapper: { tag: 'div', props: { ref: '{splitRef}', 'aria-label': '{text}' } },
    css: '.ms-split { display: inline-block; overflow: hidden }',
  }),
})
