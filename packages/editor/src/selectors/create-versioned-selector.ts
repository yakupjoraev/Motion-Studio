/** The values a selector's cache is keyed on. Compared with `Object.is`, never descended into. */
export type SelectorKey = readonly unknown[]

const sameKey = (left: SelectorKey, right: SelectorKey): boolean =>
  left.length === right.length && left.every((value, index) => Object.is(value, right[index]))

/**
 * A cache of size one. No deep equality, no proxy tracking: the key is a short list of values that
 * change exactly when the result would, so a cache check is a couple of `Object.is` calls.
 *
 * The key is a list rather than a single `version` because the cache lives in this module while
 * `version` lives in a store — two stores at the same version would read each other's results, which
 * is every test file that builds a second store. Keying on the document *reference* cannot collide.
 * ADR-055 has the measurement.
 */
export function createVersionedSelector<S, R>(
  keyFn: (state: S) => SelectorKey,
  computeFn: (state: S) => R,
): (state: S) => R {
  let cache: { key: SelectorKey; value: R } | null = null

  return (state) => {
    const key = keyFn(state)

    if (cache !== null && sameKey(cache.key, key)) {
      return cache.value
    }

    const value = computeFn(state)
    cache = { key, value }

    return value
  }
}
