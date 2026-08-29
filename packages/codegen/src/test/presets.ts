import type { MotionCodegenFragment, MotionPresetRegistry } from '@motion-studio/motion'
import type { MotionSpec } from '@motion-studio/schema'
import { z } from 'zod'

/**
 * The injected catalogue — ADR-226. `codegen` takes the preset registry as an argument precisely so it
 * can be a fake here, and the fragments below are the shape `motionFragment` in `packages/motion`
 * produces: two hoisted constants, a `motion.div` wrapper that names both, and one import.
 *
 * CODE_STANDARDS.md § Testing style allows the injected fake and bans mocking our own modules. This is
 * the former: the seam is a parameter, and nothing here replaces a module.
 */
const variants = (name: string, distance: number): string =>
  `const ${name}Variants = {\n  hidden: { opacity: 0, y: ${distance} },\n  visible: { opacity: 1, y: 0 },\n}`

const transition = (name: string, duration: number): string =>
  `const ${name}Transition = {\n  duration: ${duration},\n  ease: [0.16, 1, 0.3, 1],\n}`

function motionFragment(name: string, distance: number, duration: number): MotionCodegenFragment {
  return {
    imports: [{ from: 'motion/react', named: ['motion'] }],
    helpers: [
      { name: `${name}Variants`, source: variants(name, distance) },
      { name: `${name}Transition`, source: transition(name, duration) },
    ],
    wrapper: {
      tag: 'motion.div',
      props: {
        variants: `{${name}Variants}`,
        initial: '"hidden"',
        whileInView: '"visible"',
        viewport: '{{ once: true, amount: 0.3 }}',
        transition: `{${name}Transition}`,
      },
    },
  }
}

const SHINE_CSS = '@keyframes ms-shine {\n  to { background-position: 200% 0; }\n}'

interface FixturePreset {
  readonly id: string
  readonly engine: 'css' | 'motion' | 'gsap'
  readonly fragment: (
    params: Readonly<Record<string, number | string | boolean>>,
  ) => MotionCodegenFragment
}

const PRESETS: readonly FixturePreset[] = [
  {
    id: 'fade-up',
    engine: 'motion',
    fragment: (params) =>
      motionFragment(
        'fadeUp',
        typeof params['distance'] === 'number' ? params['distance'] : 32,
        typeof params['duration'] === 'number' ? params['duration'] : 0.6,
      ),
  },
  {
    id: 'blur-in',
    engine: 'motion',
    fragment: () => motionFragment('blurIn', 16, 0.7),
  },
  {
    id: 'shine',
    engine: 'css',
    fragment: () => ({ imports: [], classNames: ['ms-shine'], css: SHINE_CSS }),
  },
  {
    id: 'scroll-parallax',
    engine: 'gsap',
    /** The GSAP shape: a plugin registration, which is a statement rather than a declaration. */
    fragment: () => ({
      imports: [{ from: 'gsap', named: ['gsap', 'ScrollTrigger'] }],
      hooks: ['useGsapParallax(ref)'],
      helpers: [{ name: 'registerScrollTrigger', source: 'gsap.registerPlugin(ScrollTrigger)' }],
    }),
  },
]

/**
 * The params a fixture preset declares, with the defaults `codegen` reads when a document stores none
 * — ADR-255. A real catalogue entry parses before it prints, and a fixture whose schema threw would
 * assert that it does not.
 */
const FIXTURE_PARAMS = z.object({
  distance: z.number().default(32),
  duration: z.number().default(0.6),
})

/**
 * `MotionPreset` asks for `resolve`, `resolveReduced` and controls, none of which the export reads.
 * They are declared as throwing stubs rather than as plausible implementations: a fixture that quietly
 * answers a question the export never asks is a fixture that hides a missing call.
 */
export function fixturePresets(): MotionPresetRegistry {
  const unreachable = (): never => {
    throw new Error('The export engine calls codegen(), never resolve()')
  }

  const list = PRESETS.map((preset) => ({
    id: preset.id,
    name: preset.id,
    channel: 'entrance' as const,
    engine: preset.engine,
    paramsSchema: FIXTURE_PARAMS,
    defaults: { distance: 32, duration: 0.6 },
    controls: [],
    capabilities: { composableWith: [], cost: 'cheap' as const },
    resolve: unreachable,
    resolveReduced: unreachable,
    codegen: preset.fragment,
  }))

  const byId = new Map(list.map((preset) => [preset.id, preset]))

  return {
    get: (id: string) => byId.get(id),
    list: () => list,
  }
}

export const spec = (presetId: string, overrides: Partial<MotionSpec> = {}): MotionSpec => ({
  presetId,
  channel: 'entrance',
  trigger: { kind: 'inView', amount: 0.3, once: true, margin: '0px' },
  params: {},
  ...overrides,
})
