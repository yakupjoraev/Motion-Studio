import { ERROR_CODES, MotionStudioError } from '../errors/errors'

/**
 * The `default:` arm of every exhaustive switch in the codebase. Its parameter is `never`, so adding
 * a member to a union breaks the build at each switch that does not handle it — that is the feature,
 * and it is why the parameter type must not be widened.
 */
export function assertNever(value: never, message?: string): never {
  throw new MotionStudioError(
    message ?? `Unhandled case: ${JSON.stringify(value)}`,
    ERROR_CODES.unhandledCase,
  )
}

/**
 * Narrows a name in statement position. Pairs with `assertDefined`, which narrows an expression —
 * an `asserts` signature cannot do that, and an index access has no name to narrow. See ADR-014.
 */
export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new MotionStudioError(message, ERROR_CODES.invariantViolated)
  }
}

/**
 * Returns the value so it can wrap an index access directly:
 * `const node = assertDefined(doc.nodes[id], 'missing node')`.
 */
export function assertDefined<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined) {
    throw new MotionStudioError(message, ERROR_CODES.valueNotDefined)
  }

  return value
}
