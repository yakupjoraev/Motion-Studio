import { BREAKPOINTS, type BreakpointId, type NodeId } from '@motion-studio/schema'

import { type IRWarning, warning } from '../../warnings'
import type { IRChild, IRElement, IRRule } from '../ir.types'
import { mergeAndSort } from '../tailwind/merge-classes'

/**
 * Pass 3 — EXPORT_ENGINE.md § Class generation and RESPONSIVE_ENGINE.md § Codegen, since ADR-252.
 *
 * A block's producer is a pure function of its props, so what a breakpoint's overrides do to the
 * markup is answerable by running it again with those props and comparing. That comparison is this
 * file, and it replaces the declared class rules that no block ever wrote.
 *
 * Two things can differ between the base tree and a breakpoint's:
 *
 * - **classes**, which are carried by prefixing the ones the override adds — `md:grid-cols-2` beside
 *   `grid-cols-1`, which is what a person would have written by hand;
 * - **inline declarations**, which cannot be prefixed at all. The element gains a generated class and
 *   the declarations move to the stylesheet, where a media query can hold the override.
 *
 * Anything else — an override that changes the *shape* of the subtree — is reported rather than
 * guessed at, because a page that silently drew a different number of cells at one width would be a
 * defect nobody could see in the source.
 */
export interface ResponsiveLayer {
  readonly breakpoint: BreakpointId
  readonly root: IRElement
}

export interface ResponsiveResult {
  readonly root: IRElement
  readonly rules: readonly IRRule[]
  readonly warnings: readonly IRWarning[]
}

/** `v-` rather than `ms-`: `ms-*` is Tailwind's margin-inline-start utility and would sort as one. */
const classFor = (nodeId: NodeId, path: readonly number[]): string =>
  `v-${String(nodeId).replace(/[^a-zA-Z0-9]+/g, '-')}${path.length === 0 ? '' : `-${path.join('-')}`}`

const declarationsOf = (cssVars: Readonly<Record<string, string>>): readonly string[] =>
  Object.entries(cssVars).map(([property, value]) => `${property}: ${value}`)

const sameVars = (
  left: Readonly<Record<string, string>> | undefined,
  right: Readonly<Record<string, string>> | undefined,
): boolean => JSON.stringify(left ?? {}) === JSON.stringify(right ?? {})

interface Walk {
  readonly rules: IRRule[]
  readonly warnings: IRWarning[]
  readonly nodeId: NodeId
}

const elementAt = (root: IRElement, path: readonly number[]): IRElement | undefined => {
  let current: IRChild | undefined = root

  for (const index of path) {
    if (current === undefined || current.kind !== 'element') {
      return undefined
    }

    current = current.children[index]
  }

  return current !== undefined && current.kind === 'element' ? current : undefined
}

/** The classes this breakpoint adds, prefixed. A class that carries its own prefix cannot take a second. */
function prefixed(
  base: readonly string[],
  override: readonly string[],
  breakpoint: BreakpointId,
  walk: Walk,
): readonly string[] {
  const prefix = BREAKPOINTS[breakpoint].prefix
  const known = new Set(base)
  const added = override.filter((className) => !known.has(className))
  const carried: string[] = []

  for (const className of added) {
    if (className.includes(':')) {
      walk.warnings.push(
        warning(
          'unsupported',
          `'${className}' steps across breakpoints itself, so the ${breakpoint} override cannot be prefixed; the base classes stand.`,
          walk.nodeId,
        ),
      )

      continue
    }

    carried.push(`${prefix}${className}`)
  }

  return carried
}

function element(
  base: IRElement,
  layers: readonly ResponsiveLayer[],
  path: readonly number[],
  walk: Walk,
): IRElement {
  const counterparts = layers
    .map((layer) => ({ breakpoint: layer.breakpoint, element: elementAt(layer.root, path) }))
    .filter((entry) => entry.element !== undefined && entry.element.tag === base.tag)

  if (counterparts.length !== layers.length) {
    walk.warnings.push(
      warning(
        'unsupported',
        'A breakpoint override changes the shape of this block, which a single tree cannot carry; the base markup stands.',
        walk.nodeId,
      ),
    )
  }

  const classNames = [...base.classNames]
  let previous: readonly string[] = base.classNames

  for (const { breakpoint, element: layer } of counterparts) {
    if (layer === undefined) {
      continue
    }

    // Rule 4 of RESPONSIVE_ENGINE.md § Codegen: an override equal to the inherited value is dead.
    if (layer.classNames.join(' ') !== previous.join(' ')) {
      classNames.push(...prefixed(base.classNames, layer.classNames, breakpoint, walk))
      previous = layer.classNames
    }
  }

  const overriding = counterparts.filter((entry) => !sameVars(entry.element?.cssVars, base.cssVars))
  const generated = classFor(walk.nodeId, path)
  const carriesVars = overriding.length > 0 && base.cssVars !== undefined

  if (carriesVars && base.cssVars !== undefined) {
    walk.rules.push({ selector: `.${generated}`, declarations: declarationsOf(base.cssVars) })

    let last = base.cssVars

    for (const entry of overriding) {
      const vars = entry.element?.cssVars

      if (vars === undefined || sameVars(vars, last)) {
        continue
      }

      walk.rules.push({
        selector: `.${generated}`,
        declarations: declarationsOf(vars),
        media: `(min-width: ${BREAKPOINTS[entry.breakpoint].min}px)`,
      })

      last = vars
    }

    classNames.push(generated)
  }

  const children = base.children.map((child, index) =>
    child.kind === 'element' ? element(child, layers, [...path, index], walk) : child,
  )

  // Where the declarations moved to the stylesheet, the element no longer carries them inline.
  const { cssVars: _moved, ...withoutVars } = base
  const kept = carriesVars ? withoutVars : base

  return { ...kept, classNames: mergeAndSort(classNames), children }
}

export function applyResponsive(
  base: IRElement,
  layers: readonly ResponsiveLayer[],
  nodeId: NodeId,
): ResponsiveResult {
  if (layers.length === 0) {
    return { root: base, rules: [], warnings: [] }
  }

  const walk: Walk = { rules: [], warnings: [], nodeId }
  const root = element(base, layers, [], walk)

  return { root, rules: walk.rules, warnings: walk.warnings }
}
