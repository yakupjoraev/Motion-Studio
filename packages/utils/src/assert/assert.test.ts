import { describe, expect, it } from 'vitest'

import { ERROR_CODES } from '../errors/errors'
import { codeOfThrown } from '../test/errors'
import { assertDefined, assertNever, invariant } from './assert'

type Background =
  | { kind: 'solid'; color: string }
  | { kind: 'linear'; angle: number }
  | { kind: 'mesh'; points: number }

function describeBackground(background: Background): string {
  switch (background.kind) {
    case 'solid':
      return background.color
    case 'linear':
      return `${background.angle}deg`
    case 'mesh':
      return `${background.points} points`
    default:
      return assertNever(background)
  }
}

function labelBackground(background: Background): string {
  switch (background.kind) {
    case 'solid':
    case 'linear':
    case 'mesh':
      return background.kind
    default:
      return assertNever(background, 'unsupported background')
  }
}

/**
 * The `default:` arm is unreachable by the type system, which is the point of `assertNever`. It is
 * reachable at run time through exactly this path: a document serialised by a newer version of the
 * app, parsed back with a member the running build does not know. `JSON.parse` returns `any`, so no
 * cast is involved and the test exercises the real route rather than a fabricated one.
 */
function backgroundFromFutureDocument(json: string): Background {
  return JSON.parse(json)
}

describe('assertNever', () => {
  it('lets an exhaustive switch return without reaching the default arm', () => {
    expect(describeBackground({ kind: 'solid', color: 'red' })).toBe('red')
    expect(describeBackground({ kind: 'linear', angle: 45 })).toBe('45deg')
    expect(describeBackground({ kind: 'mesh', points: 4 })).toBe('4 points')
  })

  it('throws with the unhandled value serialised when a union member escapes the switch', () => {
    const future = backgroundFromFutureDocument('{"kind":"conic","angle":10}')

    expect(() => describeBackground(future)).toThrow('Unhandled case: {"kind":"conic","angle":10}')
  })

  it('carries the unhandledCase code', () => {
    const future = backgroundFromFutureDocument('{"kind":"conic"}')

    expect(codeOfThrown(() => describeBackground(future))).toBe(ERROR_CODES.unhandledCase)
  })

  it('prefers a caller-supplied message over the serialised value', () => {
    const future = backgroundFromFutureDocument('{"kind":"conic"}')

    expect(() => labelBackground(future)).toThrow('unsupported background')
  })
})

describe('invariant', () => {
  it('returns without throwing on a truthy condition', () => {
    expect(() => invariant(1, 'never seen')).not.toThrow()
  })

  it('throws the message on a falsy condition', () => {
    expect(() => invariant(0, 'count must be positive')).toThrow('count must be positive')
  })

  it('carries the invariantViolated code', () => {
    expect(codeOfThrown(() => invariant(false, 'nope'))).toBe(ERROR_CODES.invariantViolated)
  })

  it('narrows the asserted name for the rest of the scope', () => {
    const maybe: string | undefined = 'present'

    invariant(maybe !== undefined, 'maybe is missing')

    // `maybe.length` does not compile without the assertion above, which is what is being tested.
    expect(maybe.length).toBe(7)
  })
})

describe('assertDefined', () => {
  it('returns the value unchanged when it is present', () => {
    expect(assertDefined('value', 'missing')).toBe('value')
  })

  it('returns falsy-but-defined values rather than treating them as missing', () => {
    expect(assertDefined(0, 'missing')).toBe(0)
    expect(assertDefined('', 'missing')).toBe('')
    expect(assertDefined(false, 'missing')).toBe(false)
  })

  it('throws on undefined', () => {
    expect(() => assertDefined(undefined, 'node is missing')).toThrow('node is missing')
  })

  it('throws on null', () => {
    expect(() => assertDefined(null, 'node is missing')).toThrow('node is missing')
  })

  it('carries the valueNotDefined code', () => {
    expect(codeOfThrown(() => assertDefined(null, 'nope'))).toBe(ERROR_CODES.valueNotDefined)
  })

  it('narrows an index access without an intermediate variable', () => {
    const nodes: Record<string, { id: string }> = { a: { id: 'a' } }

    const node = assertDefined(nodes['a'], 'missing node')

    expect(node.id).toBe('a')
  })
})
