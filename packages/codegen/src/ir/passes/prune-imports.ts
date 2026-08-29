import type { ImportSpec } from '@motion-studio/schema'

import type { HoistedConst, IRElement } from '../ir.types'

/**
 * ADR-256. A block descriptor declares the imports a hand-written implementation would need, and since
 * the markup producers replaced component references with elements (ADR-249), most of those bindings
 * never appear in the printed file. An unused import is not cosmetic: `import Accordion from
 * '@radix-ui/react-accordion'` does not type-check against a package with no default export, and the
 * `package.json` beside it installs a dependency the page never loads.
 *
 * So the rule is usage, not declaration: an import survives when the file names it, and a dependency
 * survives when a surviving import comes from it.
 */
const IDENTIFIER = /[A-Za-z_$][\w$]*/g

const namesIn = (source: string): readonly string[] => source.match(IDENTIFIER) ?? []

export interface ReferencesInput {
  readonly element: IRElement
  readonly hooks: readonly string[]
  readonly hoisted: readonly HoistedConst[]
}

/** Every identifier the printed component will contain: tags, expressions, hooks, hoisted constants. */
export function referencedNames(input: ReferencesInput): ReadonlySet<string> {
  const names = new Set<string>()

  const add = (source: string): void => {
    for (const name of namesIn(source)) {
      names.add(name)
    }
  }

  const walk = (element: IRElement): void => {
    add(element.tag)

    for (const value of Object.values(element.attributes)) {
      if (value.kind === 'expression') {
        add(value.code)
      }

      if (value.kind === 'reference') {
        add(value.name)
      }
    }

    for (const child of element.children) {
      if (child.kind === 'element') {
        walk(child)
      }

      if (child.kind === 'expression') {
        add(child.code)
      }
    }
  }

  walk(input.element)
  input.hooks.forEach(add)

  for (const constant of input.hoisted) {
    add(constant.code)
  }

  return names
}

/** The imports whose bindings the file names, with the bindings it does not name dropped. */
export function pruneImports(
  specs: readonly ImportSpec[],
  referenced: ReadonlySet<string>,
): readonly ImportSpec[] {
  return specs.flatMap((spec) => {
    const named = (spec.named ?? []).filter((name) => referenced.has(name))
    const keepsDefault = spec.default !== undefined && referenced.has(spec.default)

    if (named.length === 0 && !keepsDefault) {
      return []
    }

    return [
      {
        from: spec.from,
        ...(named.length > 0 ? { named } : {}),
        ...(keepsDefault ? { default: spec.default } : {}),
        ...(spec.typeOnly === true ? { typeOnly: true } : {}),
      },
    ]
  })
}

/** `@scope/name/sub` → `@scope/name`, `name/sub` → `name`, a relative or aliased path → nothing. */
export function packageOf(specifier: string): string | undefined {
  if (specifier.startsWith('.') || specifier.startsWith('@/') || specifier.startsWith('node:')) {
    return undefined
  }

  const parts = specifier.split('/')

  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

export function pruneDependencies(
  dependencies: Readonly<Record<string, string>>,
  specifiers: readonly string[],
): Record<string, string> {
  const installed = new Set(specifiers.map(packageOf).filter((name) => name !== undefined))

  return Object.fromEntries(Object.entries(dependencies).filter(([name]) => installed.has(name)))
}
