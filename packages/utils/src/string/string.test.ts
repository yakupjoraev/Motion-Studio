import { describe, expect, it } from 'vitest'

import { camel, escapeHtml, humanize, kebab, pascal, truncate } from './string'

describe('kebab', () => {
  it('converts camelCase', () => {
    expect(kebab('meshGradient')).toBe('mesh-gradient')
  })

  it('converts PascalCase', () => {
    expect(kebab('MeshGradient')).toBe('mesh-gradient')
  })

  it('converts snake_case and spaces', () => {
    expect(kebab('mesh_gradient')).toBe('mesh-gradient')
    expect(kebab('Mesh Gradient')).toBe('mesh-gradient')
  })

  it('leaves an already-kebab string alone', () => {
    expect(kebab('mesh-gradient')).toBe('mesh-gradient')
  })

  it('splits an acronym from the word that follows it', () => {
    expect(kebab('HTTPRequest')).toBe('http-request')
  })

  it('keeps digits with the word they follow', () => {
    expect(kebab('heading2Large')).toBe('heading2-large')
  })

  it('returns an empty string for input with no word characters', () => {
    expect(kebab('---')).toBe('')
    expect(kebab('')).toBe('')
  })
})

describe('camel', () => {
  it('converts kebab-case', () => {
    expect(camel('mesh-gradient')).toBe('meshGradient')
  })

  it('lowercases the first word of PascalCase', () => {
    expect(camel('MeshGradient')).toBe('meshGradient')
  })

  it('joins more than two words', () => {
    expect(camel('border beam effect')).toBe('borderBeamEffect')
  })

  it('leaves a single lowercase word alone', () => {
    expect(camel('gradient')).toBe('gradient')
  })

  it('returns an empty string for an empty input', () => {
    expect(camel('')).toBe('')
  })
})

describe('pascal', () => {
  it('converts kebab-case', () => {
    expect(pascal('mesh-gradient')).toBe('MeshGradient')
  })

  it('converts camelCase', () => {
    expect(pascal('meshGradient')).toBe('MeshGradient')
  })

  it('leaves an already-Pascal string alone', () => {
    expect(pascal('MeshGradient')).toBe('MeshGradient')
  })

  it('returns an empty string for an empty input', () => {
    expect(pascal('')).toBe('')
  })
})

describe('humanize', () => {
  it('turns a camelCase identifier into a sentence-cased label', () => {
    expect(humanize('backgroundColor')).toBe('Background color')
  })

  it('turns a property path into a label, dropping the punctuation', () => {
    expect(humanize('plans[0].price')).toBe('Plans 0 price')
  })

  it('handles a nested path', () => {
    expect(humanize('theme.palette.accent')).toBe('Theme palette accent')
  })

  it('capitalises a single word', () => {
    expect(humanize('opacity')).toBe('Opacity')
  })

  it('returns an empty string for input with no word characters', () => {
    expect(humanize('')).toBe('')
    expect(humanize('...')).toBe('')
  })
})

describe('truncate', () => {
  it('leaves a short string alone', () => {
    expect(truncate('short', 10)).toBe('short')
  })

  it('leaves a string of exactly the maximum length alone', () => {
    expect(truncate('exactly10!', 10)).toBe('exactly10!')
  })

  it('counts the ellipsis inside the budget', () => {
    const result = truncate('abcdefghijkl', 6)

    expect(result).toBe('abcde…')
    expect(result).toHaveLength(6)
  })

  it('honours a custom ellipsis and still respects the budget', () => {
    const result = truncate('abcdefghijkl', 6, '...')

    expect(result).toBe('abc...')
    expect(result).toHaveLength(6)
  })

  it('returns a clipped ellipsis when the budget cannot fit one', () => {
    expect(truncate('abcdef', 1, '...')).toBe('.')
    expect(truncate('abcdef', 3, '...')).toBe('...')
  })

  it('returns an empty string for a budget of zero or less', () => {
    expect(truncate('abcdef', 0)).toBe('')
    expect(truncate('abcdef', -5)).toBe('')
  })
})

describe('escapeHtml', () => {
  it('escapes all five characters', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;')
  })

  it('escapes a tag so it cannot open an element', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
  })

  it('escapes the ampersand first, so a tag does not become &amp;lt;', () => {
    expect(escapeHtml('<')).toBe('&lt;')
  })

  it('escapes an already-escaped entity again rather than leaving it half-processed', () => {
    expect(escapeHtml('&amp;')).toBe('&amp;amp;')
  })

  it('leaves text with none of the five characters alone', () => {
    expect(escapeHtml('plain text, 100% safe')).toBe('plain text, 100% safe')
  })

  it('returns an empty string for an empty input', () => {
    expect(escapeHtml('')).toBe('')
  })
})
