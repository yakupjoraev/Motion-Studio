import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import { sliderControl } from '../shared'

import { ON_SCROLL } from './progress'

/** `x` and friends are transform functions; `translateX(-40px)` needs the unit a number does not carry. */
const FUNCTIONS: Readonly<Record<string, string>> = {
  x: 'translateX',
  y: 'translateY',
  z: 'translateZ',
  scale: 'scale',
  scaleX: 'scaleX',
  scaleY: 'scaleY',
  rotate: 'rotate',
  rotateX: 'rotateX',
  rotateY: 'rotateY',
  rotateZ: 'rotateZ',
}

const LENGTHS = new Set(['x', 'y', 'z'])
const ANGLES = new Set(['rotate', 'rotateX', 'rotateY', 'rotateZ'])

type Values = Record<string, number | string>

interface Stop {
  readonly at: number
  /** Every property named so far, at the value this stop leaves it — see `stopsOf`. */
  readonly values: Values
}

/**
 * `0:opacity=0|0.5:opacity=1|1:y=-40` → one stop per position, in order, each carrying **every**
 * property named up to it.
 *
 * The carry-forward is the part that matters. CSS fills a property missing from a keyframe with the
 * element's underlying value, so a sequence that fades in and then lifts would fade back out on the
 * way to the lift. Repeating the held value at every later stop is what makes the emitted animation
 * mean the same thing as the sequence the user wrote.
 */
function stopsOf(source: string): readonly Stop[] {
  const parsed: { at: number; property: string; value: number | string }[] = []

  for (const step of source.split('|')) {
    const [at, assignment] = step.split(':')
    const [property, value] = (assignment ?? '').split('=')

    if (at === undefined || property === undefined || value === undefined) {
      continue
    }

    const position = Number(at)

    if (Number.isNaN(position)) {
      continue
    }

    parsed.push({
      at: Math.min(Math.max(position, 0), 1),
      property,
      value: Number.isNaN(Number(value)) ? value : Number(value),
    })
  }

  const held: Values = {}

  return parsed
    .sort((one, other) => one.at - other.at)
    .map(({ at, property, value }) => {
      held[property] = value

      return { at, values: { ...held } }
    })
}

const unit = (property: string, value: number | string): string => {
  if (typeof value === 'string') {
    return value
  }

  if (LENGTHS.has(property)) {
    return `${value}px`
  }

  return ANGLES.has(property) ? `${value}deg` : String(value)
}

/** One stop's declarations, with the transform components folded into a single `transform`. */
function declarations(values: Values): string {
  const plain: string[] = []
  const transforms: string[] = []

  for (const [property, value] of Object.entries(values)) {
    const fn = FUNCTIONS[property]

    if (fn === undefined) {
      plain.push(`${property}: ${value}`)

      continue
    }

    transforms.push(`${fn}(${unit(property, value)})`)
  }

  return [
    ...plain,
    ...(transforms.length === 0 ? [] : [`transform: ${transforms.join(' ')}`]),
  ].join('; ')
}

/** What the element ends up animating, in CSS terms, so composition can find a conflict (ADR-143). */
function properties(stops: readonly Stop[]): readonly string[] {
  const names = new Set<string>()

  for (const property of Object.keys(stops.at(-1)?.values ?? {})) {
    names.add(FUNCTIONS[property] === undefined ? property : 'transform')
  }

  return [...names]
}

/**
 * The animation's name has to differ when the keyframes differ: two nodes in one document each emit
 * their own `@keyframes`, and two blocks named the same would leave one of them running the other's
 * sequence. djb2 over the source, base 36 — short enough to read in a stylesheet, and derived rather
 * than counted, so the same params produce the same name in the studio and in the export.
 */
function suffix(source: string): string {
  let digest = 5381

  for (const character of source) {
    digest = (digest * 33 + (character.codePointAt(0) ?? 0)) | 0
  }

  return Math.abs(digest).toString(36)
}

/**
 * The stylesheet a scrubbed sequence is: the keyframes, and a rule that holds them still.
 *
 * `animation-play-state: paused` stops the clock; a **negative** `animation-delay` seeks it, so a
 * progress of 0.4 is the frame 400 ms into a one-second animation. The whole scrub is therefore one
 * custom property — the same `--ms-scroll-progress` the shared bus already writes for every other
 * scroll preset — and no library and no per-frame JavaScript (ADR-349).
 */
function stylesheet(name: string, stops: readonly Stop[]): string {
  const frames = stops
    .map((stop) => `  ${Math.round(stop.at * 100)}% { ${declarations(stop.values)} }`)
    .join('\n')

  return `@keyframes ${name} {
${frames}
}
.${name} { animation: ${name} 1s linear paused both; animation-delay: calc(-1s * var(--ms-scroll-progress, 0)) }`
}

/**
 * A multi-keyframe sequence, scrubbed against scroll progress: several properties, several stops,
 * each one held until the next changes it.
 */
export const scrollTimeline = definePreset({
  id: 'scroll-timeline',
  name: 'Scroll timeline',
  channel: 'scroll',
  engine: 'css',
  paramsSchema: z.object({
    keyframes: z.string().min(1).default('0:opacity=0|0.5:opacity=1|1:y=-40'),
    scrub: z.number().min(0).max(3).default(1),
  }),
  defaults: { keyframes: '0:opacity=0|0.5:opacity=1|1:y=-40', scrub: 1 },
  controls: [sliderControl('scrub', 'Scrub', 0, 3, { step: 0.1, unit: 's' })],
  capabilities: { composableWith: ['hover', 'cursor'], cost: 'heavy' },
  resolve: (params) => {
    const stops = stopsOf(params.keyframes)
    const name = `ms-scroll-timeline-${suffix(params.keyframes)}`

    return {
      engine: 'css',
      className: name,
      properties: properties(stops),
      cssVars: { '--ms-scroll-progress': '0' },
      transition: { duration: 0 },
      listeners: ON_SCROLL,
      keyframes: stylesheet(name, stops),
    }
  },
  /**
   * Every stop folded together, applied at once — the state the sequence was heading towards. The
   * last stop alone is not it: a timeline that fades in and then lifts ends up visible *and* lifted,
   * and taking only the lift would leave the element at the opacity the first stop set.
   */
  resolveReduced: (params) => {
    const merged = stopsOf(params.keyframes).at(-1)?.values ?? {}

    return {
      engine: 'css',
      ...(Object.keys(merged).length === 0 ? {} : { variants: { end: merged } }),
      transition: { duration: 0 },
    }
  },
  /**
   * `scrub` is seconds of catch-up, and `useSpring` is what smooths a scroll value in Motion:
   * `visualDuration` is the time the value takes to settle where the eye can see it, and `bounce: 0`
   * keeps it monotonic — a scrub that overshoots would run the sequence backwards. A scrub of 0 reads
   * the scroll value itself, so the smoothing is not paid for when it was not asked for.
   */
  codegen: (params) => {
    const name = `ms-scroll-timeline-${suffix(params.keyframes)}`
    const smoothed = params.scrub > 0
    const value = smoothed ? 'scrubbedProgress' : 'scrollYProgress'

    return {
      imports: [
        { from: 'motion/react', named: smoothed ? ['useScroll', 'useSpring'] : ['useScroll'] },
        { from: 'react', named: ['useEffect', 'useRef'] },
      ],
      classNames: [name],
      css: stylesheet(name, stopsOf(params.keyframes)),
      hooks: [
        'const timelineRef = useRef<HTMLDivElement | null>(null)',
        "const { scrollYProgress } = useScroll({ target: timelineRef, offset: ['start end', 'end start'] })",
        ...(smoothed
          ? [
              `const scrubbedProgress = useSpring(scrollYProgress, { visualDuration: ${params.scrub}, bounce: 0 })`,
            ]
          : []),
        `useEffect(() => {
  const element = timelineRef.current

  if (element === null || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }

  return ${value}.on('change', (progress) => {
    element.style.setProperty('--ms-scroll-progress', String(progress))
  })
}, [${value}])`,
      ],
      wrapper: { tag: 'div', props: { ref: '{timelineRef}' } },
    }
  },
})
