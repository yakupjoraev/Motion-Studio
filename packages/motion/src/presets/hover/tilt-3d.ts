import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import type { ListenerSpec } from '../../model/preset.types'
import { sliderControl, springControl, springNameSchema, switchControl, timing } from '../shared'

const POINTER: readonly ListenerSpec[] = [{ event: 'pointerMove', variant: 'rest' }]

/**
 * **The perspective goes on the parent and the rotation on the child.** A single element carrying both
 * rotates inside its own vanishing point, and the result reads like a skew rather than a tilt — the
 * usual mistake, and the reason this preset emits a wrapper as well as a class.
 *
 * Like `magnetic`, the angles arrive as custom properties from the shared pointer bus: no React render
 * per pointer move.
 */
export const tilt3d = definePreset({
  id: 'tilt-3d',
  name: 'Tilt 3D',
  channel: 'hover',
  engine: 'css',
  paramsSchema: z.object({
    maxTilt: z.number().min(0).max(30).default(10),
    perspective: z.number().min(200).max(2000).default(800),
    glare: z.boolean().default(false),
    spring: springNameSchema.default('gentle'),
  }),
  defaults: { maxTilt: 10, perspective: 800, glare: false, spring: 'gentle' },
  controls: [
    sliderControl('maxTilt', 'Max tilt', 0, 30, { unit: '°' }),
    sliderControl('perspective', 'Perspective', 200, 2000, { step: 20, unit: 'px' }),
    switchControl('glare', 'Glare'),
    springControl(),
  ],
  capabilities: { composableWith: ['entrance', 'cursor'], gpuHeavy: true, cost: 'moderate' },
  resolve: (params) => ({
    engine: 'css',
    className: params.glare ? 'ms-tilt ms-tilt-glare' : 'ms-tilt',
    properties: ['transform'],
    cssVars: {
      '--ms-tilt-max': `${params.maxTilt}deg`,
      '--ms-tilt-perspective': `${params.perspective}px`,
      '--ms-tilt-x': '0deg',
      '--ms-tilt-y': '0deg',
    },
    transition: timing({ spring: params.spring }),
    listeners: POINTER,
    keyframes: `.ms-tilt-scene { perspective: var(--ms-tilt-perspective) }
.ms-tilt { transform: rotateX(var(--ms-tilt-x)) rotateY(var(--ms-tilt-y)); transform-style: preserve-3d }
.ms-tilt-glare::after { content: ''; position: absolute; inset: 0; background: linear-gradient(105deg, transparent 40%, rgb(255 255 255 / 0.18) 50%, transparent 60%); pointer-events: none }`,
  }),
  resolveReduced: () => ({ engine: 'css' }),
  codegen: (params) => ({
    imports: [{ from: 'react', named: ['useRef'] }],
    hooks: ['const tiltRef = useRef<HTMLDivElement>(null)'],
    wrapper: {
      tag: 'div',
      props: {
        className: `"ms-tilt-scene"`,
        onPointerMove: `{(event) => {
  const element = tiltRef.current
  if (element === null) return
  const box = element.getBoundingClientRect()
  const px = (event.clientX - box.left) / box.width - 0.5
  const py = (event.clientY - box.top) / box.height - 0.5
  element.style.setProperty('--ms-tilt-y', \`\${px * ${params.maxTilt}}deg\`)
  element.style.setProperty('--ms-tilt-x', \`\${-py * ${params.maxTilt}}deg\`)
}}`,
      },
    },
    css: `.ms-tilt-scene { perspective: ${params.perspective}px }
.ms-tilt { transform: rotateX(var(--ms-tilt-x, 0deg)) rotateY(var(--ms-tilt-y, 0deg)) }`,
  }),
})

/** The two angles a pointer position inside the element means. Fractions are 0…1 across the box. */
export const tiltAngles = (
  fraction: { readonly x: number; readonly y: number },
  maxTilt: number,
): { readonly rotateX: number; readonly rotateY: number } => ({
  rotateX: -(fraction.y - 0.5) * maxTilt,
  rotateY: (fraction.x - 0.5) * maxTilt,
})
