import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import type { ListenerSpec } from '../../model/preset.types'
import { sliderControl } from '../shared'

const SCRAMBLE: readonly ListenerSpec[] = [
  { event: 'hover', variant: 'hover' },
  { event: 'frame', variant: 'hover' },
]

/**
 * The characters churn and settle back into the label. It runs on the shared frame loop rather than a
 * timer of its own — a per-instance `setInterval` on a nav of eight links is eight timers the tab
 * keeps alive, which is the thing the scheduler exists to prevent.
 *
 * The element's real text stays in the DOM: the scramble writes to a `data-` attribute the class
 * paints from, so what a screen reader reads never becomes `X8#qz`.
 */
export const textScramble = definePreset({
  id: 'text-scramble',
  name: 'Text scramble',
  channel: 'hover',
  engine: 'motion',
  paramsSchema: z.object({
    speed: z.number().min(20).max(200).default(40),
    charset: z.string().min(2).max(64).default('!<>-_\\/[]{}—=+*^?#'),
  }),
  defaults: { speed: 40, charset: '!<>-_\\/[]{}—=+*^?#' },
  controls: [sliderControl('speed', 'Speed', 20, 200, { step: 5, unit: 'ms' })],
  capabilities: { composableWith: ['entrance', 'cursor'], cost: 'moderate' },
  resolve: (params) => ({
    engine: 'motion',
    // No variant: what changes is text content, which is not a style property, so nothing here can
    // collide with another channel's transform (ADR-140).
    cssVars: {
      '--ms-scramble-speed': `${params.speed}ms`,
      '--ms-scramble-charset': `"${params.charset}"`,
    },
    transition: { duration: params.speed * 12 },
    listeners: SCRAMBLE,
  }),
  /** Text that rewrites itself is motion in the strictest sense; reduced motion gets the label. */
  resolveReduced: () => ({ engine: 'motion' }),
  codegen: (params) => ({
    imports: [{ from: 'react', named: ['useRef', 'useState'] }],
    hooks: [
      'const scrambleRef = useRef<number | null>(null)',
      'const [scrambled, setScrambled] = useState(text)',
      `const startScramble = () => {
  const charset = ${JSON.stringify(params.charset)}
  let frame = 0
  const run = () => {
    setScrambled(
      text
        .split('')
        .map((character, index) =>
          index < frame ? character : charset[Math.floor(Math.random() * charset.length)],
        )
        .join(''),
    )
    frame += 0.5
    if (frame <= text.length) scrambleRef.current = window.setTimeout(run, ${params.speed})
  }
  run()
}`,
    ],
    wrapper: {
      tag: 'span',
      props: { onPointerEnter: '{startScramble}', 'aria-label': '{text}' },
    },
  }),
})
