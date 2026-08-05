import { describe, expect, it } from 'vitest'

import { type Result, err, isOk, map, ok, unwrapOr } from './result'

describe('ok', () => {
  it('wraps a value as a success', () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 })
  })

  it('wraps undefined as a success rather than collapsing it to a failure', () => {
    expect(ok(undefined)).toEqual({ ok: true, value: undefined })
  })
})

describe('err', () => {
  it('wraps an error as a failure', () => {
    const error = new Error('bad input')

    expect(err(error)).toEqual({ ok: false, error })
  })
})

describe('isOk', () => {
  it('is true for a success', () => {
    expect(isOk(ok(1))).toBe(true)
  })

  it('is false for a failure', () => {
    expect(isOk(err('nope'))).toBe(false)
  })

  it('narrows the union so the value is reachable without a cast', () => {
    const result: Result<number, string> = ok(7)

    // `result.value` does not compile before the guard, which is what makes this a type predicate
    // rather than a boolean helper.
    expect(isOk(result) ? result.value : 0).toBe(7)
  })
})

describe('map', () => {
  it('transforms the value of a success', () => {
    expect(map(ok(2), (n) => n * 3)).toEqual({ ok: true, value: 6 })
  })

  it('passes a failure through without calling the transform', () => {
    let called = false

    const result = map(err<string>('bad'), (n: number) => {
      called = true
      return n * 3
    })

    expect(result).toEqual({ ok: false, error: 'bad' })
    expect(called).toBe(false)
  })

  it('can change the value type', () => {
    expect(map(ok(2), (n) => `${n}px`)).toEqual({ ok: true, value: '2px' })
  })
})

describe('unwrapOr', () => {
  it('returns the value of a success', () => {
    expect(unwrapOr(ok(5), 0)).toBe(5)
  })

  it('returns the fallback for a failure', () => {
    expect(unwrapOr(err<string>('bad'), 0)).toBe(0)
  })

  it('returns a falsy success value rather than the fallback', () => {
    expect(unwrapOr(ok(0), 99)).toBe(0)
  })
})
