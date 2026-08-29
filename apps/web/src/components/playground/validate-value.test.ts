import { describe, expect, it } from 'vitest'

import { validateValue } from './validate-value'

/**
 * PLAYGROUND.md § Parsing and validation, layers 1 to 3. Prompt 48 moves this into `packages/schema`
 * beside `sanitizeDocument`; until then these are the assertions that stop the playground applying
 * something it should not.
 */
describe('structure', () => {
  it('accepts a value the browser accepts', () => {
    expect(validateValue('background', 'red')).toEqual({ ok: true, value: 'red' })
  })

  it('refuses an unclosed parenthesis and counts what is open', () => {
    const result = validateValue('background', 'linear-gradient(red, blue')

    expect(result.ok).toBe(false)
    expect(result.ok ? '' : result.errors[0]?.message).toContain('1 still open')
  })

  it('refuses a stray closing parenthesis', () => {
    const result = validateValue('background', 'red)')

    expect(result.ok ? '' : result.errors[0]?.message).toContain('more closing than opening')
  })

  it('refuses braces, which belong to a stylesheet', () => {
    const result = validateValue('background', '{ red }')

    expect(result.ok ? '' : result.errors[0]?.message).toContain('braces')
  })

  it('refuses a semicolon, which ends a declaration this is not', () => {
    const result = validateValue('background', 'red; color: blue')

    expect(result.ok ? '' : result.errors[0]?.message).toContain('semicolon')
  })

  it('refuses an unclosed quote', () => {
    const result = validateValue('mask-image', 'url("data:image/png;base64,AAA')

    expect(result.ok).toBe(false)
  })

  it('ignores a parenthesis inside a string', () => {
    expect(validateValue('background', 'linear-gradient(red, blue)').ok).toBe(true)
  })

  it('refuses an empty value with something a reader can act on', () => {
    const result = validateValue('background', '   ')

    expect(result.ok ? '' : result.errors[0]?.message).toContain('Write a value')
  })

  it('caps the length at 8 kB', () => {
    const result = validateValue('background', `red ${'x'.repeat(9000)}`)

    expect(result.ok ? '' : result.errors[0]?.message).toContain('cap is 8192')
  })
})

/** Layer 2 — every entry is an injection vector with no legitimate use in a value here. */
describe('the blocklist', () => {
  it.each([
    ['@import url(evil.css)'],
    ['expression(alert(1))'],
    ['behavior: url(x.htc)'],
    ['-moz-binding: url(x.xml)'],
    ['url(javascript:alert(1))'],
    ['url(https://example.com/tracker.png)'],
  ])('refuses %s', (value) => {
    expect(validateValue('background', value).ok).toBe(false)
  })

  it('allows an inline data image, which the asset sanitizer can vouch for', () => {
    const value = 'url("data:image/png;base64,iVBORw0KGgo=")'

    expect(validateValue('mask-image', value).ok).toBe(true)
  })
})

describe('normalisation', () => {
  it('is stable: validating a validated value gives the same value back', () => {
    const first = validateValue('background', '  linear-gradient(red, blue)  ')
    const second = first.ok ? validateValue('background', first.value) : first

    expect(second).toEqual(first)
  })
})
