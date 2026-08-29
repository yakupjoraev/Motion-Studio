import { describe, expect, it } from 'vitest'

import { MAX_HASH_BYTES, decodePermalink, encodePermalink } from './permalink'

describe('encodePermalink / decodePermalink', () => {
  it('round-trips a value through the hash', () => {
    const state = {
      property: 'box-shadow' as const,
      value: '0 1px 2px oklch(0% 0 0 / 0.16), 0 8px 24px oklch(0% 0 0 / 0.18)',
    }
    const hash = encodePermalink(state)

    expect(hash.ok).toBe(true)

    const decoded = hash.ok ? decodePermalink(hash.value) : undefined

    expect(decoded?.ok).toBe(true)
    expect(decoded?.ok === true && decoded.value).toEqual(state)
  })

  it('survives a value with characters a URL would eat', () => {
    const state = { property: 'background' as const, value: 'url(#a) & "quotes" +/=' }
    const hash = encodePermalink(state)

    expect(hash.ok && /^#p=background&v=[A-Za-z0-9\-_]+$/.test(hash.value)).toBe(true)
  })

  it('encodes right up to the cap and refuses one character past it', () => {
    const under = 'a'.repeat(3000)
    const over = 'a'.repeat(4000)

    expect(encodePermalink({ property: 'background', value: under }).ok).toBe(true)

    const refused = encodePermalink({ property: 'background', value: over })

    expect(refused.ok).toBe(false)
    expect(!refused.ok && refused.error).toContain(String(MAX_HASH_BYTES))
  })

  it('reads back nothing longer than the cap', () => {
    expect(decodePermalink(`#p=background&v=${'a'.repeat(MAX_HASH_BYTES)}`).ok).toBe(false)
  })
})

describe('a permalink is untrusted input', () => {
  const hashFor = (property: string, value: string): string =>
    `#p=${property}&v=${btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`

  it.each([
    ['url(javascript:alert(1))', 'blocked construct'],
    ['expression(alert(1))', 'expression'],
    ['red; behavior: url(#evil)', 'a second declaration'],
    ['url(https://example.com/tracker.png)', 'a remote url'],
  ])('refuses %s', (payload) => {
    const decoded = decodePermalink(hashFor('background', payload))

    expect(decoded.ok).toBe(false)
  })

  it('refuses a property that is not a sandbox', () => {
    expect(decodePermalink(hashFor('behavior', 'url(#x)')).ok).toBe(false)
    expect(decodePermalink(hashFor('-moz-binding', 'url(#x)')).ok).toBe(false)
  })

  it('refuses a value that is not base64 at all', () => {
    expect(decodePermalink('#p=background&v=***').ok).toBe(false)
  })

  it('refuses a hash with no value in it', () => {
    expect(decodePermalink('#p=background').ok).toBe(false)
  })
})
