import type { ControlDescriptor } from '@motion-studio/schema'
import { z } from 'zod'

import type { MotionCodegenFragment, NamedHelper } from '../codegen/fragment.types'
import { EASINGS, EASING_NAMES, type EasingName } from '../curves/easings'
import { SPRINGS, SPRING_NAMES, type SpringName } from '../curves/springs'
import type { ListenerSpec, ResolvedMotion, TransitionConfig } from '../model/preset.types'

/** The vocabulary a preset picks its curve from, as a schema and as select options. */
export const easingNameSchema = z.enum(EASING_NAMES as [EasingName, ...EasingName[]])

export const springNameSchema = z.enum(SPRING_NAMES as [SpringName, ...SpringName[]])

export const EASING_OPTIONS = EASING_NAMES.map((name) => ({ value: name, label: label(name) }))

export const SPRING_OPTIONS = SPRING_NAMES.map((name) => ({ value: name, label: label(name) }))

/**
 * WCAG 2.3.1 is three flashes a second; a repeating animation is flashing whenever its cycle is
 * shorter than a third of a second. Every repeating preset's minimum period is this, so no parameter
 * value a user can reach produces one — clamped rather than merely discouraged.
 */
export const FLASH_SAFE_MIN_MS = 400

/** The reduced entrance, verbatim from ANIMATION_SYSTEM.md § Reduced motion: opacity only, 120 ms. */
export const REDUCED_ENTRANCE: ResolvedMotion = {
  engine: 'motion',
  variants: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  transition: { duration: 120 },
  listeners: [{ event: 'inView', variant: 'visible' }],
}

/** What a cursor or continuous preset reduces to: nothing at all. */
export const DISABLED: ResolvedMotion = { engine: 'css' }

export const durationSchema = (fallback: number, min = 0, max = 3000) =>
  z.number().min(min).max(max).default(fallback)

export const delaySchema = (fallback = 0) => z.number().min(0).max(3000).default(fallback)

export const durationControl = (
  path: string,
  label_ = 'Duration',
  min = 0,
  max = 3000,
): ControlDescriptor => ({
  path,
  kind: 'slider',
  label: label_,
  options: { min, max, step: 20, unit: 'ms' },
})

export const sliderControl = (
  path: string,
  label_: string,
  min: number,
  max: number,
  options: { readonly step?: number; readonly unit?: string } = {},
): ControlDescriptor => ({
  path,
  kind: 'slider',
  label: label_,
  options: {
    min,
    max,
    step: options.step ?? 1,
    ...(options.unit === undefined ? {} : { unit: options.unit }),
  },
})

export const selectControl = (
  path: string,
  label_: string,
  options: readonly { readonly value: string; readonly label: string }[],
): ControlDescriptor => ({ path, kind: 'select', label: label_, options: { options } })

export const easingControl = (path = 'easing'): ControlDescriptor =>
  selectControl(path, 'Easing', EASING_OPTIONS)

export const springControl = (path = 'spring'): ControlDescriptor =>
  selectControl(path, 'Spring', SPRING_OPTIONS)

export const switchControl = (path: string, label_: string): ControlDescriptor => ({
  path,
  kind: 'switch',
  label: label_,
})

export const colorControl = (path: string, label_: string): ControlDescriptor => ({
  path,
  kind: 'color',
  label: label_,
})

/** A transition from the two shapes a preset can choose: a named curve or a named spring. */
export const timing = (params: {
  readonly duration?: number
  readonly delay?: number
  readonly easing?: EasingName
  readonly spring?: SpringName
}): TransitionConfig => ({
  ...(params.spring === undefined
    ? {
        duration: params.duration ?? 0,
        ...(params.easing === undefined ? {} : { ease: EASINGS[params.easing] }),
      }
    : { spring: SPRINGS[params.spring] }),
  ...(params.delay === undefined || params.delay === 0 ? {} : { delay: params.delay }),
})

/** The entrance every in-view preset shares: hidden until it arrives, then visible, once. */
export const IN_VIEW: readonly ListenerSpec[] = [{ event: 'inView', variant: 'visible' }]

export const HOVER_LISTENERS: readonly ListenerSpec[] = [{ event: 'hover', variant: 'hover' }]

/** `motion/react`, which every preset on that engine imports and nothing else does. */
export const MOTION_IMPORT = { from: 'motion/react', named: ['motion'] } as const

export const helper = (name: string, source: string): NamedHelper => ({ name, source })

/**
 * The fragment a Motion-engine preset emits: one hoisted variants object, one hoisted transition, and
 * a `motion.div` that names both. `buildIR` dedupes the helpers by content, so eight `fade-up`
 * sections emit one variants object — ANIMATION_SYSTEM.md § Codegen.
 */
export function motionFragment(args: {
  readonly name: string
  readonly variants: Record<string, unknown>
  readonly transition: Record<string, unknown>
  readonly trigger?: 'inView' | 'mount'
}): MotionCodegenFragment {
  const variantsName = `${args.name}Variants`
  const transitionName = `${args.name}Transition`

  return {
    imports: [MOTION_IMPORT],
    helpers: [
      helper(variantsName, `const ${variantsName} = ${JSON.stringify(args.variants, null, 2)}`),
      helper(
        transitionName,
        `const ${transitionName} = ${JSON.stringify(args.transition, null, 2)}`,
      ),
    ],
    wrapper: {
      tag: 'motion.div',
      props: {
        variants: `{${variantsName}}`,
        initial: `"hidden"`,
        ...(args.trigger === 'mount'
          ? { animate: `"visible"` }
          : { whileInView: `"visible"`, viewport: '{{ once: true, amount: 0.3 }}' }),
        transition: `{${transitionName}}`,
      },
    },
  }
}

/** The fragment a css-engine preset emits: a class and the keyframes or custom properties it needs. */
export function cssFragment(className: string, css: string): MotionCodegenFragment {
  return { imports: [], classNames: [className], css }
}

function label(name: string): string {
  const spaced = name.replace(/([A-Z])/g, ' $1').replace(/-/g, ' ')

  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
