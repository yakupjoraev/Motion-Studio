import { describe, expect, it } from 'vitest'

import { MALICIOUS_CSS, SAFE_CSS } from '../__fixtures__/malicious'

import { CSS_BLOCKLIST, findBlockedConstructs } from './blocklist'
import { normalizeCssValue } from './normalize'
import { MAX_VALUE_LENGTH, findStructuralIssues } from './structural'
import { validateCssDeclaration, validateCssValue } from './validate-css'

const rejected = (value: string) => {
  const result = validateCssValue(value)

  return result.ok ? null : result.error
}

describe('every blocklist entry has a fixture that it stops', () => {
  it.each(CSS_BLOCKLIST.map((entry) => entry.id))('rejects the %s payload', (id) => {
    const fixture = Object.values(MALICIOUS_CSS).find((value) =>
      findBlockedConstructs(value).some((hit) => hit.id === id),
    )

    expect(fixture, `no fixture exercises the ${id} rule`).toBeDefined()
    expect(rejected(fixture as string)).not.toBeNull()
  })
})

describe('the structural layer runs first', () => {
  it.each([
    ['comment', MALICIOUS_CSS.comment],
    ['escape', MALICIOUS_CSS.escape],
    ['unbalanced', MALICIOUS_CSS.unbalanced],
    ['semicolon', MALICIOUS_CSS.semicolon],
    ['brace', MALICIOUS_CSS.brace],
  ])('rejects %s before any pattern matching happens', (_label, value) => {
    const errors = rejected(value)

    expect(errors?.[0]?.layer).toBe('structural')
  })

  it('rejects a value past the length cap', () => {
    expect(rejected('a'.repeat(MAX_VALUE_LENGTH + 1))?.[0]?.id).toBe('too-long')
  })

  it('rejects an unterminated string', () => {
    expect(findStructuralIssues('"abc').map((issue) => issue.kind)).toContain('unterminated-string')
  })

  it('does not mistake a quoted parenthesis for an unbalanced one', () => {
    expect(findStructuralIssues('"("')).toEqual([])
  })
})

describe('safe values survive', () => {
  it.each(Object.entries(SAFE_CSS))('accepts the %s fixture', (_label, value) => {
    expect(validateCssValue(value).ok).toBe(true)
  })

  it('normalises whitespace so two spellings serialise the same', () => {
    const spaced = validateCssValue('  rgb( 12   12  16 / 60% )  ')
    const tight = validateCssValue('rgb(12 12 16 / 60%)')

    expect(spaced.ok && tight.ok && spaced.value === tight.value).toBe(true)
  })

  it('leaves the inside of a quoted string alone', () => {
    expect(normalizeCssValue('"a   b"')).toBe('"a   b"')
  })
})

describe('validateCssDeclaration', () => {
  it('accepts a property and its value together', () => {
    const result = validateCssDeclaration('box-shadow', SAFE_CSS.shadow)

    expect(result.ok && result.value.property).toBe('box-shadow')
  })

  it.each(['Box-Shadow', 'box shadow', '', 'x'.repeat(60), 'javascript:'])(
    'rejects %s as a property name',
    (property) => {
      expect(validateCssDeclaration(property, 'red').ok).toBe(false)
    },
  )

  it('rejects a blocked value even under a legal property', () => {
    expect(validateCssDeclaration('background', MALICIOUS_CSS.url).ok).toBe(false)
  })
})
