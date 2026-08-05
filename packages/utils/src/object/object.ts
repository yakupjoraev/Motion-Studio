const NUMERIC = /^\d+$/

/**
 * `plans[0].price` → `['plans', '0', 'price']`. Bracket notation is normalised to dots first, so both
 * forms produce one segment list.
 *
 * Only numeric brackets are recognised. A quoted key such as `a['b-c']` is not supported: nothing in
 * the document model has a key that cannot be written after a dot, and accepting quotes would mean
 * parsing escapes.
 */
function parsePath(path: string): string[] {
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter((segment) => segment.length > 0)
}

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null
}

/** Excludes arrays, `Date`, `Map`, class instances — anything `JSON.parse` would not have produced. */
function isPlainObject(value: unknown): value is object {
  if (!isObject(value)) {
    return false
  }

  const prototype: unknown = Object.getPrototypeOf(value)

  return prototype === Object.prototype || prototype === null
}

/**
 * Lets the recursive walkers below destructure a head without the compiler doubting it. Without the
 * tuple type, `noUncheckedIndexedAccess` makes every `segments[0]` a `string | undefined` and each
 * walker grows an arm that can never run — an untestable branch under a 90 % branch floor.
 */
function isNonEmpty(segments: readonly string[]): segments is readonly [string, ...string[]] {
  return segments.length > 0
}

/**
 * Reads a value by path. Returns `undefined` for a missing path and never throws — a prop editor asks
 * for paths that do not exist yet, and that is not an error.
 *
 * Typed `unknown` in and out. Path-based access cannot be soundly typed, and a generic that pretends
 * otherwise is worse than being honest about it.
 *
 * An empty path returns the target itself, which is the root the path is relative to.
 */
export function getPath(target: unknown, path: string): unknown {
  let current: unknown = target

  for (const segment of parsePath(path)) {
    if (!isObject(current)) {
      return undefined
    }

    current = Reflect.get(current, segment)
  }

  return current
}

function setSegments(
  container: object,
  segments: readonly [string, ...string[]],
  value: unknown,
): void {
  const [head, ...rest] = segments

  if (!isNonEmpty(rest)) {
    Reflect.set(container, head, value)
    return
  }

  const existing: unknown = Reflect.get(container, head)

  if (isObject(existing)) {
    // Reuse without rewriting it. `setPath` runs on an Immer draft, and assigning a drafted child
    // back over itself is a write Immer records as a change that did not happen.
    setSegments(existing, rest, value)
    return
  }

  const [next] = rest
  const child: object = NUMERIC.test(next) ? [] : {}

  Reflect.set(container, head, child)
  setSegments(child, rest, value)
}

/**
 * Writes a value by path, mutating in place because it runs on an Immer draft. Missing intermediate
 * containers are created: an array when the next segment is numeric, an object otherwise.
 *
 * A non-object target or an empty path is a no-op rather than a throw, for the same reason `getPath`
 * returns `undefined` — the caller is a prop editor, not a validator.
 */
export function setPath(target: unknown, path: string, value: unknown): void {
  const segments = parsePath(path)

  if (!isObject(target) || !isNonEmpty(segments)) {
    return
  }

  setSegments(target, segments, value)
}

function deleteSegments(container: object, segments: readonly [string, ...string[]]): void {
  const [head, ...rest] = segments

  if (isNonEmpty(rest)) {
    const child: unknown = Reflect.get(container, head)

    if (isObject(child)) {
      deleteSegments(child, rest)
    }

    return
  }

  if (Array.isArray(container) && NUMERIC.test(head)) {
    // Splice, not `delete`: a hole serialises to `null` and comes back as `null`, which breaks the
    // round-trip `FILE_FORMAT.md` § Testing asserts. See ADR-013.
    container.splice(Number(head), 1)
    return
  }

  Reflect.deleteProperty(container, head)
}

/** Removes the value at a path, mutating in place. A missing path is a no-op. */
export function deletePath(target: unknown, path: string): void {
  const segments = parsePath(path)

  if (!isObject(target) || !isNonEmpty(segments)) {
    return
  }

  deleteSegments(target, segments)
}

/**
 * Structural comparison of JSON-shaped values, with `Object.is` at the leaves — so `NaN` equals `NaN`
 * and `+0` does not equal `-0`. `Date`, `Map`, `Set`, and class instances compare by reference, and
 * there is no cycle detection: none of them can reach this function from a parsed document. See
 * ADR-016.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => deepEqual(item, b[index]))
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = Object.keys(a)

    return (
      keys.length === Object.keys(b).length &&
      keys.every((key) => key in b && deepEqual(Reflect.get(a, key), Reflect.get(b, key)))
    )
  }

  return false
}

/**
 * Keeps only the listed keys, in the source's own key order rather than the order they were listed —
 * a stable order is what makes the serialisation in `FILE_FORMAT.md` § Testing byte-stable.
 */
export function pick<T extends object, K extends keyof T>(
  source: T,
  keys: readonly K[],
): Pick<T, K> {
  const kept: ReadonlySet<PropertyKey> = new Set(keys)
  const result = { ...source }

  for (const key of Object.keys(result)) {
    if (!kept.has(key)) {
      Reflect.deleteProperty(result, key)
    }
  }

  return result
}

/** Removes the listed keys. The source is not mutated. */
export function omit<T extends object, K extends keyof T>(
  source: T,
  keys: readonly K[],
): Omit<T, K> {
  const result = { ...source }

  for (const key of keys) {
    Reflect.deleteProperty(result, key)
  }

  return result
}
