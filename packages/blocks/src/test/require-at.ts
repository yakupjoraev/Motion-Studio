/**
 * The element at an index, or a failure that names the index.
 *
 * `noUncheckedIndexedAccess` is on, so `defaults.plans[0]` is `Plan | undefined` — correct, and awkward in
 * a test that is spreading a known fixture. A non-null assertion would silence it; this reports which
 * index was missing instead, which is the difference between a test that fails and a test that explains.
 */
export function requireAt<T>(items: readonly T[], index: number): T {
  const item = items[index]

  if (item === undefined) {
    throw new Error(`No item at index ${index} of ${items.length}`)
  }

  return item
}
