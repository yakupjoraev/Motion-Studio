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

type SplitBy = (typeof BY)[number]

/**
 * The split, as source the export owns. Words and characters are a wrap; **lines are a
 * measurement** — the browser decides where the text breaks, so every word's top edge is read
 * before anything moves, and the words are then rebuilt into one element per line. Measuring while
 * rewriting is what makes a hand-rolled split wrong: the second read sees the first move.
 */
const SPLIT_TEXT = `const splitText = (element: HTMLElement, source: string, by: 'line' | 'word' | 'char'): HTMLElement[] => {
  // The whole string stays readable to a screen reader; the pieces are decoration.
  element.setAttribute('aria-label', source)
  element.textContent = ''

  const units = by === 'char' ? Array.from(source) : source.split(/\\s+/).filter((word) => word !== '')
  const parts: HTMLElement[] = []

  for (const [index, unit] of units.entries()) {
    if (unit.trim() === '') {
      element.append(' ')
      continue
    }

    if (index > 0 && by !== 'char') {
      element.append(' ')
    }

    parts.push(appendPart(element, unit))
  }

  if (by !== 'line') {
    return parts
  }

  const tops = parts.map((part) => part.offsetTop)

  element.textContent = ''

  const lines: HTMLElement[] = []
  let previous: number | undefined
  let line: HTMLElement | undefined

  for (const [index, part] of parts.entries()) {
    if (line === undefined || tops[index] !== previous) {
      line = appendPart(element, '')
      lines.push(line)
      previous = tops[index]
    } else {
      line.append(' ')
    }

    line.append(part.textContent ?? '')
  }

  return lines
}`

/**
 * Both helpers are `const`, not `function`: `buildIR` shares a hoisted **declaration** between the
 * components that need it and keeps a statement local (ADR-259), and a split repeated in six section
 * files is the same forty lines six times.
 */
const APPEND_PART = `const appendPart = (element: HTMLElement, text: string): HTMLElement => {
  const part = document.createElement('span')

  part.className = 'ms-split'
  part.setAttribute('aria-hidden', 'true')
  part.textContent = text
  element.append(part)

  return part
}`

/** Lines stack, so they are blocks; words and characters sit in the line they were part of. */
const partCss = (by: SplitBy, duration: number): string =>
  `.ms-split { display: ${by === 'line' ? 'block' : 'inline-block'}; overflow: hidden }
.ms-text-reveal-visible .ms-split { animation: ms-text-reveal ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) both }
@keyframes ms-text-reveal { from { transform: translateY(110%); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`

/**
 * Text that arrives a line, a word or a character at a time.
 *
 * In the studio the element reveals as one piece: the split is a property of the exported markup,
 * not of the document, and the canvas shows the entrance the block will play. The export does split,
 * with its own code rather than a licensed plugin — ADR-349, which is also why this preset is on the
 * `motion` engine now.
 *
 * The split must not cost the text its readability: the original string goes into `aria-label` on the
 * container and every generated span is `aria-hidden`, because a screen reader reading forty
 * one-character spans is a serious regression, not a cosmetic one.
 */
export const textReveal = definePreset({
  id: 'text-reveal',
  name: 'Text reveal',
  channel: 'entrance',
  engine: 'motion',
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
    engine: 'motion',
    variants: {
      hidden: { y: '110%', opacity: 0 },
      visible: { y: '0%', opacity: 1 },
    },
    transition: { duration: params.duration, stagger: { each: params.stagger, from: 'first' } },
    listeners: IN_VIEW,
  }),
  /** The text, whole and still. The split itself is the motion, so there is nothing left to reduce. */
  resolveReduced: () => REDUCED_ENTRANCE,
  codegen: (params) => ({
    imports: [{ from: 'react', named: ['useEffect', 'useRef'] }],
    helpers: [helper('splitText', SPLIT_TEXT), helper('appendPart', APPEND_PART)],
    classNames: ['ms-text-reveal'],
    css: partCss(params.by, params.duration),
    hooks: [
      'const splitRef = useRef<HTMLDivElement | null>(null)',
      `useEffect(() => {
  const element = splitRef.current

  if (element === null || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }

  const source = element.textContent ?? ''
  const split = () => {
    // The stagger, as one delay per part: each waits for the ones before it.
    for (const [index, part] of splitText(element, source, '${params.by}').entries()) {
      part.style.animationDelay = \`\${index * ${params.stagger}}ms\`
    }
  }

  split()

  // The reveal starts when the text arrives, once, and the class is what the stylesheet keys off.
  const arrival = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        element.classList.add('ms-text-reveal-visible')
        arrival.disconnect()
      }
    },
    { threshold: 0.3 },
  )

  arrival.observe(element)
${
  params.by === 'line'
    ? `
  // Lines are a measurement, so they are re-measured when the container's width changes.
  const resize = new ResizeObserver(() => split())

  resize.observe(element)
`
    : ''
}
  return () => {
    arrival.disconnect()${params.by === 'line' ? '\n    resize.disconnect()' : ''}
    element.textContent = source
  }
}, [])`,
    ],
    wrapper: { tag: 'div', props: { ref: '{splitRef}' } },
  }),
})
