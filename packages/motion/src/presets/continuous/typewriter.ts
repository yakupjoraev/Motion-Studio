import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import { DISABLED, FLASH_SAFE_MIN_MS, sliderControl, switchControl } from '../shared'

import { ALWAYS } from './float'

/**
 * Phrases typed and deleted in turn. The caret blinks at 1 Hz — a caret is the one place a repeating
 * opacity change is conventional, and one blink a second is far under the flash threshold.
 *
 * The phrases live in the params rather than in the children, because the block underneath renders
 * one element and this preset decides what is in it.
 */
export const typewriter = definePreset({
  id: 'typewriter',
  name: 'Typewriter',
  channel: 'continuous',
  engine: 'motion',
  paramsSchema: z.object({
    speed: z.number().min(20).max(400).default(70),
    phrases: z.string().min(1).default('Design it.|Ship it.'),
    caret: z.boolean().default(true),
  }),
  defaults: { speed: 70, phrases: 'Design it.|Ship it.', caret: true },
  controls: [
    sliderControl('speed', 'Speed', 20, 400, { step: 5, unit: 'ms' }),
    switchControl('caret', 'Caret'),
  ],
  capabilities: { composableWith: ['entrance', 'cursor'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'motion',
    // The text is content, not a style property, so this channel collides with nothing (ADR-140).
    className: params.caret ? 'ms-typewriter ms-typewriter-caret' : 'ms-typewriter',
    cssVars: {
      '--ms-typewriter-speed': `${params.speed}ms`,
      '--ms-typewriter-phrases': `"${params.phrases}"`,
    },
    transition: {
      duration: Math.max(params.speed * 12, FLASH_SAFE_MIN_MS),
      repeat: 'infinite',
    },
    listeners: ALWAYS,
    keyframes: `@keyframes ms-caret { 50% { opacity: 0 } }
.ms-typewriter-caret::after { content: '|'; animation: ms-caret 1000ms steps(1, end) infinite }`,
  }),
  resolveReduced: () => DISABLED,
  codegen: (params) => ({
    imports: [{ from: 'react', named: ['useEffect', 'useState'] }],
    hooks: [
      `const phrases = ${JSON.stringify(params.phrases.split('|'))}`,
      'const [typed, setTyped] = useState(phrases[0] ?? "")',
      `useEffect(() => {
  let phrase = 0
  let letter = 0
  const timer = window.setInterval(() => {
    const current = phrases[phrase] ?? ''
    letter = letter < current.length ? letter + 1 : 0
    if (letter === 0) phrase = (phrase + 1) % phrases.length
    setTyped(current.slice(0, letter))
  }, ${params.speed})
  return () => window.clearInterval(timer)
}, [])`,
    ],
    wrapper: { tag: 'span', props: { className: '"ms-typewriter"' } },
    css: `@keyframes ms-caret { 50% { opacity: 0 } }
.ms-typewriter::after { content: '|'; animation: ms-caret 1000ms steps(1, end) infinite }`,
  }),
})
