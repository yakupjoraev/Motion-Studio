import { describe, expect, it } from 'vitest'

import { motionProperties } from '../model/compose'
import { createPresetRegistry } from '../model/define-preset'
import type { MotionPreset, PresetParams, ResolveContext } from '../model/preset.types'
import { policyFor } from '../reduced/policy'

import { PRESETS, presetRegistry } from './index'
import { FLASH_SAFE_MIN_MS } from './shared'

const ctx = (overrides: Partial<ResolveContext> = {}): ResolveContext => ({
  reduced: false,
  scale: 1,
  presets: presetRegistry,
  ...overrides,
})

/** Every transform component plus the whole property, which is what a reduced channel may not keep. */
const TRANSFORMS = new Set([
  'transform',
  'x',
  'y',
  'z',
  'scale',
  'scaleX',
  'scaleY',
  'rotate',
  'rotateX',
  'rotateY',
  'rotateZ',
  'skewX',
  'skewY',
])

/** The extremes a user can reach through the controls, read off the schema itself. */
function extremes(preset: MotionPreset): readonly PresetParams[] {
  const shape = (
    preset.paramsSchema as { readonly _def?: { readonly shape?: () => unknown } }
  )._def?.shape?.()
  const fields = shape === undefined ? {} : (shape as Record<string, unknown>)
  const cases: PresetParams[] = [preset.defaults]

  for (const [key, field] of Object.entries(fields)) {
    const checks =
      (
        field as {
          readonly _def?: { readonly checks?: readonly { kind: string; value: number }[] }
        }
      )._def?.checks ?? []

    for (const check of checks) {
      if (check.kind === 'min' || check.kind === 'max') {
        cases.push({ ...preset.defaults, [key]: check.value })
      }
    }
  }

  return cases
}

describe('the catalogue', () => {
  it('registers every preset under its own id', () => {
    const ids = PRESETS.map((preset) => preset.id)

    expect(new Set(ids).size).toBe(ids.length)

    for (const preset of PRESETS) {
      expect(presetRegistry.get(preset.id)).toBe(preset)
    }
  })

  it('uses GSAP for exactly the presets that need what Motion cannot do', () => {
    const gsap = PRESETS.filter((preset) => preset.engine === 'gsap').map((preset) => preset.id)

    // The count is the specification, not a guideline — prompt 32 § Engine selection.
    expect(gsap).toEqual(['text-reveal', 'horizontal-scroll', 'scroll-timeline'])
  })
})

describe.each(PRESETS.map((preset) => [preset.id, preset] as const))('%s', (_id, preset) => {
  it('resolves with its defaults', () => {
    const resolved = preset.resolve(preset.defaults, ctx())

    expect(resolved.engine).toBe(preset.engine)
  })

  it('has defaults that satisfy its own schema', () => {
    const parsed = preset.paramsSchema.safeParse(preset.defaults)

    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data).toEqual(preset.defaults)
  })

  it('gives every control a path the schema knows', () => {
    for (const control of preset.controls) {
      const [head] = control.path.split('.')

      expect(Object.keys(preset.defaults)).toContain(head)
    }
  })

  it('declares a cost class and what it composes with', () => {
    expect(['cheap', 'moderate', 'heavy']).toContain(preset.capabilities.cost)
    expect(preset.capabilities.composableWith.length).toBeGreaterThan(0)
  })

  it('reduces the way its channel says it must', () => {
    const reduced = preset.resolveReduced(preset.defaults, ctx({ reduced: true }))

    if (preset.channel === 'cursor' || preset.channel === 'continuous') {
      expect(reduced).toEqual({ engine: 'css' })

      return
    }

    if (preset.channel === 'scroll') {
      // § Reduced motion: the static end state. A transform *value* is allowed — what is not
      // allowed is anything that still moves, so nothing may be listening or timed.
      expect(reduced.listeners).toBeUndefined()
      expect(reduced.transition?.duration ?? 0).toBe(0)

      return
    }

    if (preset.channel === 'exit') {
      expect(reduced.transition).toEqual({ duration: 0 })

      return
    }

    for (const property of motionProperties(reduced)) {
      expect(TRANSFORMS.has(property)).toBe(false)
    }
  })

  it('cannot repeat faster than three times a second at any parameter extreme', () => {
    for (const params of extremes(preset)) {
      const parsed = preset.paramsSchema.safeParse(params)

      if (!parsed.success) {
        continue
      }

      const resolved = preset.resolve(parsed.data, ctx())
      const { transition } = resolved

      if (transition?.repeat === undefined) {
        continue
      }

      expect(transition.duration ?? FLASH_SAFE_MIN_MS).toBeGreaterThanOrEqual(FLASH_SAFE_MIN_MS)
    }
  })

  it('emits a codegen fragment that names its imports', () => {
    const fragment = preset.codegen(preset.defaults, {
      nodeName: 'Node',
      scale: 1,
      reduced: false,
    })

    expect(Array.isArray(fragment.imports)).toBe(true)
    expect(fragment).toMatchSnapshot()
  })
})

describe('per-channel reduced policy', () => {
  it('disables every cursor and continuous preset outright', () => {
    for (const preset of PRESETS) {
      if (preset.channel !== 'cursor' && preset.channel !== 'continuous') {
        continue
      }

      const reduced = preset.resolveReduced(preset.defaults, ctx({ reduced: true }))

      expect(reduced).toEqual({ engine: 'css' })
    }
  })

  it('leaves a scroll preset standing at its end state', () => {
    for (const preset of PRESETS.filter((entry) => entry.channel === 'scroll')) {
      const reduced = preset.resolveReduced(preset.defaults, ctx({ reduced: true }))

      expect(reduced.listeners).toBeUndefined()
      expect(reduced.transition?.duration ?? 0).toBe(0)
    }
  })

  it('makes every exit instant', () => {
    for (const preset of PRESETS.filter((entry) => entry.channel === 'exit')) {
      expect(preset.resolveReduced(preset.defaults, ctx({ reduced: true })).transition).toEqual({
        duration: 0,
      })
    }
  })

  it('holds an entrance to opacity at 120 ms', () => {
    const entrances = PRESETS.filter((preset) => preset.channel === 'entrance')
    const registry = createPresetRegistry(entrances)

    for (const preset of entrances) {
      const reduced = preset.resolveReduced(
        preset.defaults,
        ctx({ reduced: true, presets: registry }),
      )
      const policed = policyFor('entrance')

      expect(policed).toMatchObject({ kind: 'properties', duration: 120 })

      for (const property of motionProperties(reduced)) {
        expect(['opacity', 'filter', 'clipPath', '--ms-counter']).toContain(property)
      }
    }
  })
})
