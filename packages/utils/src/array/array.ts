/**
 * Every helper here returns a new array. The commands that use them run on an Immer draft, and a
 * helper that mutated its input would produce a patch for a change Immer never saw.
 */

/**
 * Moves the item at `from` to `to`, closing the gap first. `to` is the index in the array *after*
 * removal, which is what a drop indicator between two items means — the alternative interpretation
 * makes a downward move land one position short.
 *
 * An out-of-range `from` returns a copy unchanged; `reorderNode` guards its input, and throwing here
 * would put an error path in a pure array helper.
 */
export function move<T>(items: readonly T[], from: number, to: number): T[] {
  if (from < 0 || from >= items.length) {
    return [...items]
  }

  // Built from slices rather than by splicing out the element: `splice` hands back
  // `T | undefined`, and the guard that would satisfy the compiler can never run, which leaves an
  // untestable branch under a 90 % branch floor.
  const remaining = [...items.slice(0, from), ...items.slice(from + 1)]

  return [...remaining.slice(0, to), ...items.slice(from, from + 1), ...remaining.slice(to)]
}

/** Inserts at `index`. An index past the end appends; a negative index counts from the end. */
export function insertAt<T>(items: readonly T[], index: number, item: T): T[] {
  const next = [...items]
  next.splice(index, 0, item)

  return next
}

/** Removes the item at `index`. An out-of-range index returns a copy unchanged. */
export function removeAt<T>(items: readonly T[], index: number): T[] {
  if (index < 0 || index >= items.length) {
    return [...items]
  }

  const next = [...items]
  next.splice(index, 1)

  return next
}

/** Keeps the first occurrence of each value, comparing with `Set` semantics. */
export function unique<T>(items: readonly T[]): T[] {
  return [...new Set(items)]
}

/**
 * Groups by a derived key, preserving input order within each group. Returns a `Map` rather than an
 * object so a key of `'constructor'` or `'__proto__'` cannot collide with `Object.prototype`.
 */
export function groupBy<T, K>(items: readonly T[], keyOf: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>()

  for (const item of items) {
    const key = keyOf(item)
    const group = groups.get(key)

    if (group === undefined) {
      groups.set(key, [item])
    } else {
      group.push(item)
    }
  }

  return groups
}

/** Splits into the items matching the predicate and the rest, both in input order. */
export function partition<T>(
  items: readonly T[],
  predicate: (item: T) => boolean,
): [matching: T[], rest: T[]] {
  const matching: T[] = []
  const rest: T[] = []

  for (const item of items) {
    if (predicate(item)) {
      matching.push(item)
    } else {
      rest.push(item)
    }
  }

  return [matching, rest]
}
