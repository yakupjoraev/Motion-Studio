import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import type { ListenerSpec } from '../../model/preset.types'
import { sliderControl, springControl, springNameSchema, timing } from '../shared'

const POINTER: readonly ListenerSpec[] = [{ event: 'pointerMove', variant: 'rest' }]

/**
 * The element leans toward the cursor while it is inside the radius, and springs back when it leaves.
 *
 * It reads the shared pointer bus and writes two custom properties — `--ms-magnetic-x/y` — so the
 * movement costs no React render at all. The transform that consumes them is in the emitted class,
 * which is why the resolution declares `transform` rather than naming a variant: the values change
 * sixty times a second and a variant would mean sixty renders.
 */
export const magnetic = definePreset({
  id: 'magnetic',
  name: 'Magnetic',
  channel: 'hover',
  engine: 'css',
  paramsSchema: z.object({
    strength: z.number().min(0).max(1).default(0.35),
    radius: z.number().min(40).max(600).default(180),
    spring: springNameSchema.default('gentle'),
  }),
  defaults: { strength: 0.35, radius: 180, spring: 'gentle' },
  controls: [
    sliderControl('strength', 'Strength', 0, 1, { step: 0.05 }),
    sliderControl('radius', 'Radius', 40, 600, { step: 10, unit: 'px' }),
    springControl(),
  ],
  capabilities: { composableWith: ['entrance', 'cursor'], cost: 'moderate' },
  resolve: (params) => ({
    engine: 'css',
    className: 'ms-magnetic',
    properties: ['transform'],
    cssVars: {
      '--ms-magnetic-strength': String(params.strength),
      '--ms-magnetic-radius': `${params.radius}px`,
      '--ms-magnetic-x': '0px',
      '--ms-magnetic-y': '0px',
    },
    transition: timing({ spring: params.spring }),
    listeners: POINTER,
    keyframes:
      '.ms-magnetic { transform: translate3d(var(--ms-magnetic-x), var(--ms-magnetic-y), 0) }',
  }),
  /** No transform under a reduced hover, and nothing left for the pointer to move. */
  resolveReduced: () => ({ engine: 'css' }),
  codegen: (params) => ({
    imports: [{ from: 'react', named: ['useEffect', 'useRef'] }],
    hooks: [
      'const magneticRef = useRef<HTMLDivElement>(null)',
      `useEffect(() => {
  const element = magneticRef.current
  if (element === null) return
  const onMove = (event: PointerEvent) => {
    const box = element.getBoundingClientRect()
    const dx = event.clientX - (box.left + box.width / 2)
    const dy = event.clientY - (box.top + box.height / 2)
    const distance = Math.hypot(dx, dy)
    const pull = distance > ${params.radius} ? 0 : ${params.strength}
    element.style.setProperty('--ms-magnetic-x', \`\${dx * pull}px\`)
    element.style.setProperty('--ms-magnetic-y', \`\${dy * pull}px\`)
  }
  document.addEventListener('pointermove', onMove, { passive: true })
  return () => document.removeEventListener('pointermove', onMove)
}, [])`,
    ],
    wrapper: { tag: 'div', props: { ref: '{magneticRef}', className: `"ms-magnetic"` } },
    css: '.ms-magnetic { transform: translate3d(var(--ms-magnetic-x, 0), var(--ms-magnetic-y, 0), 0) }',
  }),
})

/**
 * The pull the preset applies at a given cursor position, in pixels, from the element's centre.
 * Exported because it is the whole behaviour, and a test can state it without a browser.
 */
export function magneticOffset(args: {
  readonly pointer: { readonly x: number; readonly y: number }
  readonly centre: { readonly x: number; readonly y: number }
  readonly strength: number
  readonly radius: number
}): { readonly x: number; readonly y: number } {
  const dx = args.pointer.x - args.centre.x
  const dy = args.pointer.y - args.centre.y
  const pull = Math.hypot(dx, dy) > args.radius ? 0 : args.strength

  return { x: dx * pull, y: dy * pull }
}
