import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import {
  IN_VIEW,
  durationControl,
  durationSchema,
  easingControl,
  easingNameSchema,
  helper,
  sliderControl,
  timing,
} from '../shared'

const FORMATS = ['decimal', 'currency', 'percent', 'compact'] as const

type Format = (typeof FORMATS)[number]

/** The `Intl.NumberFormat` options each named format means, so the emitted source says the same thing. */
export const COUNTER_FORMATS: Readonly<Record<Format, Intl.NumberFormatOptions>> = {
  decimal: { style: 'decimal' },
  currency: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
  percent: { style: 'percent', maximumFractionDigits: 0 },
  compact: { notation: 'compact', maximumFractionDigits: 1 },
}

/**
 * A number counting up is the one entrance whose animated value is the content. Under reduced motion
 * it shows the final value immediately — a stat that never arrives is worse than one that does not
 * count, and prompt 32 states the requirement in those words.
 */
export const counter = definePreset({
  id: 'counter',
  name: 'Counter',
  channel: 'entrance',
  engine: 'motion',
  paramsSchema: z.object({
    from: z.number().min(-1_000_000).max(1_000_000).default(0),
    to: z.number().min(-1_000_000).max(1_000_000).default(100),
    duration: durationSchema(1200, 0, 5000),
    format: z.enum(FORMATS).default('decimal'),
    easing: easingNameSchema.default('expoOut'),
  }),
  defaults: { from: 0, to: 100, duration: 1200, format: 'decimal', easing: 'expoOut' },
  controls: [
    sliderControl('from', 'From', -1000, 1000),
    sliderControl('to', 'To', -1000, 1000),
    durationControl('duration', 'Duration', 0, 5000),
    easingControl(),
  ],
  capabilities: { composableWith: ['hover', 'cursor'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'motion',
    variants: {
      hidden: { '--ms-counter': params.from },
      visible: { '--ms-counter': params.to },
    },
    transition: timing(params),
    cssVars: { '--ms-counter-format': params.format },
    listeners: IN_VIEW,
  }),
  /** The end of the count, with no count. */
  resolveReduced: (params) => ({
    engine: 'motion',
    variants: { visible: { '--ms-counter': params.to } },
    transition: { duration: 0 },
    cssVars: { '--ms-counter-format': params.format },
  }),
  codegen: (params) => ({
    imports: [
      { from: 'motion/react', named: ['animate', 'useInView'] },
      { from: 'react', named: ['useEffect', 'useRef'] },
    ],
    helpers: [
      helper(
        'formatCounter',
        `const formatCounter = new Intl.NumberFormat(undefined, ${JSON.stringify(
          COUNTER_FORMATS[params.format],
        )})`,
      ),
    ],
    hooks: [
      'const counterRef = useRef<HTMLElement | null>(null)',
      'const counterInView = useInView(counterRef, { once: true, amount: 0.3 })',
      `useEffect(() => {
  const element = counterRef.current
  if (element === null || !counterInView) return
  const controls = animate(${params.from}, ${params.to}, {
    duration: ${params.duration / 1000},
    onUpdate: (value) => {
      element.textContent = formatCounter.format(value)
    },
  })
  return () => controls.stop()
}, [counterInView])`,
    ],
    wrapper: { tag: 'span', props: { ref: '{(node) => { counterRef.current = node }}' } },
  }),
})
