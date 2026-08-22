import {
  BREAKPOINTS,
  type BlockDefinition,
  type BreakpointId,
  CASCADE_ORDER,
  type ClassRule,
  type Node,
  resolveResponsiveProps,
} from '@motion-studio/schema'

import { type IRWarning, warning } from '../../warnings'
import type { IRRule, IRTheme } from '../ir.types'
import { mergeAndSort } from '../tailwind/merge-classes'

/**
 * Pass 3 — EXPORT_ENGINE.md § Class generation and RESPONSIVE_ENGINE.md § Codegen.
 *
 * One walk of the props decides three things, which is why this returns a result rather than a string
 * array: the classes, the CSS variables a `custom` rule puts on the element, and the stylesheet rules
 * those variables feed. Splitting them into three functions would mean resolving the cascade three
 * times and letting two of the answers drift.
 */
export interface ClassResult {
  readonly classNames: readonly string[]
  readonly cssVars: Readonly<Record<string, string>>
  readonly rules: readonly IRRule[]
  /** The props a rule read. What is left over is what pass 6 and the attribute step still owe. */
  readonly consumed: readonly string[]
  readonly warnings: readonly IRWarning[]
}

const EMPTY: ClassResult = {
  classNames: [],
  cssVars: {},
  rules: [],
  consumed: [],
  warnings: [],
}

/**
 * A `custom` rule's variable names its class: `--ms-hero-tint` carries `.v-hero-tint`.
 *
 * `v-` rather than the variable's own `ms-`, because `ms-*` is Tailwind's margin-inline-start utility:
 * a class called `ms-hero-tint` would sort as a margin and sit next to `ms-4` in the merge.
 */
const classFor = (variable: string): string => `v-${variable.replace(/^--(ms-)?/, '')}`

const variableFor = (variable: string, breakpoint: BreakpointId): string =>
  breakpoint === 'base' ? variable : `${variable}-${breakpoint}`

/** A value that prints. `false` and `0` do print; `undefined`, `null` and `''` do not. */
const isPrintable = (value: unknown): value is string | number | boolean =>
  (typeof value === 'string' && value !== '') ||
  typeof value === 'number' ||
  typeof value === 'boolean'

const caseKey = (value: unknown): string => (isPrintable(value) ? String(value) : '')

function variantClasses(
  rule: ClassRule,
  props: Readonly<Record<string, unknown>>,
): readonly string[] {
  if (rule.kind === 'static') {
    return rule.classes
  }

  if (rule.kind === 'variant') {
    return rule.cases[caseKey(props[rule.prop])] ?? []
  }

  return []
}

/**
 * `theme` is on the signature EXPORT_ENGINE.md specifies and is read by nothing here: every scale a
 * block spends is already a literal class in its plan (ADR-106), and the theme reaches the output as
 * CSS variables rather than as classes. It stays on the signature because a `custom` rule reading a
 * radius or a spacing step is the next thing a block will ask for.
 */
export function generateClasses(
  node: Node,
  definition: BlockDefinition,
  _theme: IRTheme,
): ClassResult {
  const rules = definition.codegen.classes ?? []

  if (rules.length === 0) {
    return EMPTY
  }

  const classNames: string[] = []
  const cssVars: Record<string, string> = {}
  const emitted: IRRule[] = []
  const warnings: IRWarning[] = []
  const consumed = new Set<string>()
  /** What the previous breakpoint resolved to, per rule index. Absent means "not emitted yet". */
  const previous = new Map<number, string>()

  for (const breakpoint of CASCADE_ORDER) {
    const override = breakpoint === 'base' ? undefined : node.responsive[breakpoint]

    if (breakpoint !== 'base' && override === undefined) {
      continue
    }

    const props = resolveResponsiveProps<Record<string, unknown>>(node, breakpoint)
    const prefix = BREAKPOINTS[breakpoint].prefix

    rules.forEach((rule, index) => {
      if (rule.kind !== 'static') {
        consumed.add(rule.prop)
      }

      if (rule.kind === 'custom') {
        const value = props[rule.prop]

        if (!isPrintable(value)) {
          return
        }

        const printed = String(value)

        // Rule 4 of RESPONSIVE_ENGINE.md § Codegen: an override equal to the inherited value is dead.
        if (previous.get(index) === printed) {
          return
        }

        previous.set(index, printed)

        const selector = `.${classFor(rule.variable)}`
        const variable = variableFor(rule.variable, breakpoint)

        cssVars[variable] = printed

        if (breakpoint === 'base') {
          classNames.push(classFor(rule.variable))
          emitted.push({ selector, declarations: [`${rule.property}: var(${variable})`] })

          return
        }

        emitted.push({
          selector,
          declarations: [`${rule.property}: var(${variable})`],
          media: `(min-width: ${BREAKPOINTS[breakpoint].min}px)`,
        })

        return
      }

      const produced = variantClasses(rule, props)
      const signature = produced.join(' ')

      if (previous.get(index) === signature) {
        return
      }

      previous.set(index, signature)

      /**
       * A case that carries its own breakpoints — the real `grid` block's `cva` map does — cannot take
       * a second prefix: `md:sm:grid-cols-2` is a class that means something else. The base classes
       * stand and the report says which override was not expressible.
       */
      if (prefix !== '' && produced.some((className) => className.includes(':'))) {
        warnings.push(
          warning(
            'unsupported',
            `'${definition.id}' steps '${rule.kind === 'static' ? '' : rule.prop}' across breakpoints itself, ` +
              `so the ${breakpoint} override cannot be prefixed; the base classes stand.`,
            node.id,
          ),
        )

        return
      }

      for (const className of produced) {
        classNames.push(`${prefix}${className}`)
      }
    })
  }

  return {
    classNames: mergeAndSort(classNames),
    cssVars,
    rules: emitted,
    consumed: [...consumed],
    warnings,
  }
}
