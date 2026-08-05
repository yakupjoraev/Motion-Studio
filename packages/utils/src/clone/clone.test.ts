import { describe, expect, it } from 'vitest'

import { ERROR_CODES } from '../errors/errors'
import { codeOfThrown } from '../test/errors'
import { clone } from './clone'

describe('clone', () => {
  it('returns a value equal to the original', () => {
    const original = { a: 1, b: { c: [1, 2, 3] } }

    expect(clone(original)).toEqual(original)
  })

  it('returns a different object, so mutating the copy leaves the original alone', () => {
    const original = { nested: { value: 1 } }
    const copy = clone(original)

    copy.nested.value = 2

    expect(original.nested.value).toBe(1)
  })

  it('clones nested arrays deeply', () => {
    const original = { items: [{ id: 'a' }] }
    const copy = clone(original)

    expect(copy.items[0]).not.toBe(original.items[0])
    expect(copy.items[0]).toEqual({ id: 'a' })
  })

  it('preserves undefined, which a JSON round-trip would drop', () => {
    const copy = clone({ a: undefined, b: 1 })

    expect('a' in copy).toBe(true)
    expect(copy.a).toBeUndefined()
  })

  it('preserves a cycle, which a JSON round-trip would throw on', () => {
    const original: { self?: unknown } = {}
    original.self = original

    const copy = clone(original)

    expect(copy.self).toBe(copy)
  })

  it('preserves a Date as a Date', () => {
    const copy = clone({ at: new Date(0) })

    expect(copy.at).toBeInstanceOf(Date)
    expect(copy.at.getTime()).toBe(0)
  })

  it('clones primitives unchanged', () => {
    expect(clone(7)).toBe(7)
    expect(clone('text')).toBe('text')
    expect(clone(null)).toBeNull()
  })

  it('throws a typed error when the value holds a function', () => {
    expect(() => clone({ run: () => undefined })).toThrow(
      'Value is not structured-cloneable. Functions, symbols, and DOM nodes cannot be cloned.',
    )
  })

  it('carries the cloneFailed code', () => {
    expect(codeOfThrown(() => clone({ run: () => undefined }))).toBe(ERROR_CODES.cloneFailed)
  })

  it('keeps the original DataCloneError as the cause', () => {
    try {
      clone({ run: () => undefined })
      expect.unreachable('clone should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect(error instanceof Error ? error.cause : undefined).toBeInstanceOf(Error)
    }
  })
})
