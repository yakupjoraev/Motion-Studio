import type { MotionCodegenFragment, MotionPresetRegistry } from '@motion-studio/motion'
import type { ImportSpec, MotionSpec, Node } from '@motion-studio/schema'

import { hash } from '../../hash'
import type { ExportOptions } from '../../options.types'
import { type IRWarning, warning } from '../../warnings'
import type { HoistedConst, IRElementMotion, IRRule, IRTheme, IRValue } from '../ir.types'

import { REDUCED_HOOK, reducedMotionRules, toValue, withReducedMotion } from './reduced-motion'

/**
 * Pass 4 — EXPORT_ENGINE.md § Motion collection. Fragments in, deduped module constants out.
 *
 * Two rules make the output look hand-written rather than assembled. Shared variant and transition
 * objects are hoisted and deduped by content, so eight `fade-up` sections emit **one** `fadeUp`. And
 * the wrapper is merged into the element rather than wrapped around it — the doc's own rule table bans
 * wrappers, and `motion.section` is what a person would have written.
 */
export interface NodeMotion {
  /** `motion.` prefixed onto the element's own tag, or absent when the element keeps its tag. */
  readonly tagPrefix?: string
  readonly attributes: Readonly<Record<string, IRValue>>
  readonly classNames: readonly string[]
  readonly imports: readonly ImportSpec[]
  readonly hooks: readonly string[]
  /** The names this node references. Placement is decided once the whole document is known. */
  readonly hoisted: readonly string[]
  /** Which presets got this far, for a target that has to approximate them — ADR-239. */
  readonly presets: readonly IRElementMotion[]
}

export const EMPTY_MOTION: NodeMotion = {
  attributes: {},
  classNames: [],
  imports: [],
  hooks: [],
  hoisted: [],
  presets: [],
}

/** Import specifier → the package the emitted `package.json` must install, at a real range. */
export const DEPENDENCIES: Readonly<Record<string, readonly [string, string]>> = {
  'motion/react': ['motion', '^11.18.2'],
  motion: ['motion', '^11.18.2'],
  gsap: ['gsap', '^3.15.0'],
  'gsap/dist/ScrollTrigger': ['gsap', '^3.15.0'],
  'next/image': ['next', '^15.5.4'],
}

export interface MotionCollector {
  collect(node: Node): NodeMotion
  readonly hoisted: ReadonlyMap<string, HoistedConst>
  readonly keyframes: readonly string[]
  readonly rules: readonly IRRule[]
  readonly dependencies: Readonly<Record<string, string>>
  readonly warnings: readonly IRWarning[]
}

export interface MotionCollectorInput {
  readonly presets: MotionPresetRegistry
  readonly theme: IRTheme
  readonly options: ExportOptions
}

export function createMotionCollector(input: MotionCollectorInput): MotionCollector {
  const { presets, theme, options } = input
  const hoisted = new Map<string, HoistedConst>()
  const byContent = new Map<string, string>()
  const keyframes: string[] = []
  const rules: IRRule[] = []
  const dependencies: Record<string, string> = {}
  const warnings: IRWarning[] = []

  if (options.includeMotion && theme.motionScale !== 1) {
    warnings.push(
      warning(
        'approximation',
        `Exported durations are the preset's own; the theme scales motion by ${theme.motionScale}.`,
      ),
    )
  }

  /** Dedupe by content, rename on a name collision, and report the name the fragment must reference. */
  function hoist(name: string, source: string): string {
    const digest = hash(source)
    const known = byContent.get(digest)

    if (known !== undefined) {
      return known
    }

    const existing = hoisted.get(name)
    const finalName = existing === undefined ? name : `${name}${hash(source).slice(0, 4)}`

    hoisted.set(finalName, { name: finalName, code: source.replace(name, finalName) })
    byContent.set(digest, finalName)

    return finalName
  }

  function addImports(specs: readonly ImportSpec[]): void {
    for (const spec of specs) {
      const dependency = DEPENDENCIES[spec.from]

      if (dependency !== undefined && dependencies[dependency[0]] === undefined) {
        dependencies[dependency[0]] = dependency[1]
        warnings.push(warning('dependency', `Adds ${dependency[0]}@${dependency[1]}.`))
      }
    }
  }

  function fragmentFor(node: Node, spec: MotionSpec): MotionCodegenFragment | undefined {
    const preset = presets.get(spec.presetId)

    if (preset === undefined) {
      warnings.push(
        warning(
          'unsupported',
          `No preset '${spec.presetId}' for the ${spec.channel} channel; the export animates nothing here.`,
          node.id,
        ),
      )

      return undefined
    }

    if (spec.stagger !== undefined) {
      warnings.push(
        warning(
          'approximation',
          `The ${spec.channel} stagger of ${spec.stagger.each} ms is not in the exported transition.`,
          node.id,
        ),
      )
    }

    return preset.codegen(spec.params, {
      nodeName: node.name,
      scale: theme.motionScale,
      reduced: true,
    })
  }

  function collect(node: Node): NodeMotion {
    if (!options.includeMotion) {
      return EMPTY_MOTION
    }

    const specs = Object.values(node.motion).filter(
      (spec): spec is MotionSpec => spec !== undefined && spec.disabled !== true,
    )

    if (specs.length === 0) {
      return EMPTY_MOTION
    }

    const attributes: Record<string, IRValue> = {}
    const classNames: string[] = []
    const imports: ImportSpec[] = []
    const hooks: string[] = []
    const referenced: string[] = []
    const applied: IRElementMotion[] = []
    let tagPrefix: string | undefined

    for (const spec of specs) {
      const fragment = fragmentFor(node, spec)

      if (fragment === undefined) {
        continue
      }

      applied.push({
        presetId: spec.presetId,
        engine: presets.get(spec.presetId)?.engine ?? 'css',
        channel: spec.channel,
      })

      const renames = new Map<string, string>()

      for (const helper of fragment.helpers ?? []) {
        const finalName = hoist(helper.name, helper.source)

        referenced.push(finalName)

        if (finalName !== helper.name) {
          renames.set(helper.name, finalName)
        }
      }

      imports.push(...fragment.imports)
      addImports(fragment.imports)
      hooks.push(...(fragment.hooks ?? []))
      classNames.push(...(fragment.classNames ?? []))

      if (fragment.css !== undefined && !keyframes.includes(fragment.css)) {
        keyframes.push(fragment.css)
      }

      rules.push(...reducedMotionRules(fragment.classNames ?? []))

      if (fragment.wrapper === undefined) {
        continue
      }

      const wrapper = fragment.wrapper
      const raw: Record<string, IRValue> = {}

      for (const [key, value] of Object.entries(wrapper.props)) {
        const rewritten = [...renames].reduce(
          (text, [from, to]) => text.split(from).join(to),
          value,
        )

        raw[key] = toValue(rewritten)
      }

      Object.assign(attributes, withReducedMotion(raw))

      if (wrapper.tag.startsWith('motion.')) {
        tagPrefix = 'motion.'
        imports.push({ from: 'motion/react', named: ['motion', 'useReducedMotion'] })
        hooks.push(REDUCED_HOOK)
      }
    }

    return {
      ...(tagPrefix === undefined ? {} : { tagPrefix }),
      attributes,
      classNames,
      imports,
      hooks: [...new Set(hooks)],
      hoisted: [...new Set(referenced)],
      presets: applied,
    }
  }

  return { collect, hoisted, keyframes, rules, dependencies, warnings }
}
