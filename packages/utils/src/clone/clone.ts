import { ERROR_CODES, MotionStudioError } from '../errors/errors'

/**
 * `structuredClone` with the failure translated into this codebase's error type.
 * `STATE_MANAGEMENT.md` § Anti-patterns rules out `JSON.parse(JSON.stringify(node))` — it drops
 * `undefined`, turns `NaN` into `null`, and throws on a cycle rather than preserving it.
 *
 * The wrapper exists for the failure, not the types: `structuredClone` throws a `DataCloneError`
 * naming nothing useful when the value holds a function or a DOM node. That is a programmer mistake,
 * and `CODE_STANDARDS.md` § Errors says programmer mistakes throw a typed error.
 */
export function clone<T>(value: T): T {
  try {
    return structuredClone(value)
  } catch (error) {
    throw new MotionStudioError(
      'Value is not structured-cloneable. Functions, symbols, and DOM nodes cannot be cloned.',
      ERROR_CODES.cloneFailed,
      error,
    )
  }
}
