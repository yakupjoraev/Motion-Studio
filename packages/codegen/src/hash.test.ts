import { describe, expect, it } from 'vitest'

import { hash, hashValue, stableStringify } from './hash'

describe('hash', () => {
  it('gives the same digest for the same input', () => {
    expect(hash('fade-up')).toBe(hash('fade-up'))
  })

  it('separates inputs that differ by one character', () => {
    expect(hash('fade-up')).not.toBe(hash('fade-dn'))
  })

  it('digests the empty string without collapsing to an empty digest', () => {
    expect(hash('')).not.toBe('')
  })
})

describe('stableStringify', () => {
  it('ignores the order the keys were written in', () => {
    const left = stableStringify({ duration: 600, ease: 'expoOut' })
    const right = stableStringify({ ease: 'expoOut', duration: 600 })

    expect(left).toBe(right)
  })

  it('keeps array order, which is meaning rather than incident', () => {
    expect(stableStringify([1, 2])).not.toBe(stableStringify([2, 1]))
  })

  it('drops undefined members so an absent key and an undefined key agree', () => {
    expect(stableStringify({ a: 1, b: undefined })).toBe(stableStringify({ a: 1 }))
  })

  it('serialises nested objects deeply rather than by reference', () => {
    expect(hashValue({ a: { b: 1 } })).toBe(hashValue({ a: { b: 1 } }))
  })

  it('serialises null and primitives', () => {
    expect(stableStringify(null)).toBe('null')
    expect(stableStringify('x')).toBe('"x"')
    expect(stableStringify(2)).toBe('2')
  })
})
