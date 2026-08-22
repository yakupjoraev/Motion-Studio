import type { ImportSpec } from '@motion-studio/schema'

/**
 * Pass 5 — EXPORT_ENGINE.md § Import collection. Merged per file, deduped, sorted, and `import type`
 * where the specifier is type-only.
 *
 * Unused imports are structurally impossible because nothing here predicts a need: every spec that
 * arrives was produced by something that is already in the element tree, the hook list, or the hoisted
 * constants. Removing the usage removes the spec, so removing the import needs no second bookkeeping.
 */
const RANKS = { builtin: 0, external: 1, alias: 2, relative: 3 } as const

function rank(from: string): number {
  if (from.startsWith('node:')) {
    return RANKS.builtin
  }

  if (from.startsWith('.')) {
    return RANKS.relative
  }

  return from.startsWith('@/') ? RANKS.alias : RANKS.external
}

/** Type-only and value imports of the same module stay two specs: one of them erases, the other does not. */
const keyOf = (spec: ImportSpec): string =>
  `${spec.typeOnly === true ? 'type' : 'value'} ${spec.from}`

export function collectImports(specs: readonly ImportSpec[]): readonly ImportSpec[] {
  const merged = new Map<
    string,
    { from: string; named: Set<string>; def?: string; typeOnly: boolean }
  >()

  for (const spec of specs) {
    const key = keyOf(spec)
    const existing = merged.get(key) ?? {
      from: spec.from,
      named: new Set<string>(),
      typeOnly: spec.typeOnly === true,
    }

    for (const name of spec.named ?? []) {
      existing.named.add(name)
    }

    if (spec.default !== undefined) {
      existing.def = spec.default
    }

    merged.set(key, existing)
  }

  return [...merged.values()]
    .sort((left, right) => {
      const groups = rank(left.from) - rank(right.from)

      if (groups !== 0) {
        return groups
      }

      if (left.from !== right.from) {
        return left.from < right.from ? -1 : 1
      }

      return left.typeOnly === right.typeOnly ? 0 : left.typeOnly ? 1 : -1
    })
    .map((entry) => ({
      from: entry.from,
      ...(entry.named.size > 0 ? { named: [...entry.named].sort() } : {}),
      ...(entry.def === undefined ? {} : { default: entry.def }),
      ...(entry.typeOnly ? { typeOnly: true } : {}),
    }))
}
