/**
 * The return type for an *expected* failure — parsing a `.motion` file, parsing user CSS
 * (`CODE_STANDARDS.md` § Errors). Programmer mistakes throw instead; a `Result` says the caller is
 * required to handle the failure, and the compiler enforces that it does.
 */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E }

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error }
}

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok
}

/** Transforms the value of a successful result and passes a failure through untouched. */
export function map<T, U, E>(result: Result<T, E>, transform: (value: T) => U): Result<U, E> {
  return result.ok ? { ok: true, value: transform(result.value) } : result
}

export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback
}
