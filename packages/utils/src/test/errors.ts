import { MotionStudioError } from '../errors/errors'

/**
 * Returns the `code` of the `MotionStudioError` a call throws. Exists so a test can assert on the
 * code without casting the `unknown` a `catch` binding gives it — `CODE_STANDARDS.md` § Banned rules
 * out `as unknown as T`, and a conditional `instanceof` inside the `catch` would let the assertion
 * silently not run.
 */
export function codeOfThrown(call: () => unknown): string {
  try {
    call()
  } catch (error) {
    if (error instanceof MotionStudioError) {
      return error.code
    }

    throw error
  }

  throw new Error('expected the call to throw a MotionStudioError, but it returned')
}
