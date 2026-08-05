/**
 * The codes thrown from this package. Callers discriminate on `code` rather than on the class: a
 * subclass with one throw site and no caller that tests it by type adds nothing checkable. See
 * ADR-012 for which subclasses exist and why there is one.
 */
export const ERROR_CODES = {
  unhandledCase: 'UNHANDLED_CASE',
  invariantViolated: 'INVARIANT_VIOLATED',
  valueNotDefined: 'VALUE_NOT_DEFINED',
  cloneFailed: 'CLONE_FAILED',
  invalidColor: 'INVALID_COLOR',
  nodeNotFound: 'NODE_NOT_FOUND',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

export class MotionStudioError extends Error {
  readonly code: string

  constructor(message: string, code: string, cause?: unknown) {
    // `cause` goes into the base constructor's options bag instead of becoming a field of our own.
    // `Error` already declares `cause`, so redeclaring it would need an `override` modifier and
    // would shadow the property every logger and devtools panel already knows how to read.
    super(message, cause === undefined ? undefined : { cause })
    this.code = code
    // `new.target` is the constructor that was called, so a subclass reports its own name here
    // without restating it.
    this.name = new.target.name
  }
}

export class NodeNotFoundError extends MotionStudioError {
  constructor(id: string) {
    super(`Node not found: ${id}`, ERROR_CODES.nodeNotFound)
  }
}
