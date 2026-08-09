import { describe, expect, it } from 'vitest'

import { parseHighlightLines, tokenize } from './highlight'

describe('parseHighlightLines', () => {
  it('reads a single line', () => {
    expect(parseHighlightLines('7')).toEqual([7])
  })

  it('expands a range', () => {
    expect(parseHighlightLines('2-4')).toEqual([2, 3, 4])
  })

  it('reads the mixed form the control documents', () => {
    expect(parseHighlightLines('2-4,7')).toEqual([2, 3, 4, 7])
  })

  it('tolerates whitespace', () => {
    expect(parseHighlightLines(' 2 - 3 , 9 ')).toEqual([2, 3, 9])
  })

  it('sorts and de-duplicates overlapping input', () => {
    expect(parseHighlightLines('5,2-4,3')).toEqual([2, 3, 4, 5])
  })

  /** The value comes from a text field somebody is still typing into — half-written is not an error. */
  it('yields nothing from input it cannot read, rather than throwing', () => {
    for (const input of ['', 'abc', '-', '2-', '-4', '0', '4-2', '1.5', ',,,']) {
      expect(parseHighlightLines(input), input).toEqual([])
    }
  })

  it('refuses a range large enough to be a denial of service', () => {
    expect(parseHighlightLines('1-100000')).toEqual([])
  })
})

describe('tokenize', () => {
  it('returns one plain run for a plain-text sample', () => {
    expect(tokenize('anything at all', 'plain')).toEqual([
      { kind: 'plain', text: 'anything at all' },
    ])
  })

  it('marks keywords', () => {
    const kinds = tokenize('const x = 1', 'ts')

    expect(kinds[0]).toEqual({ kind: 'keyword', text: 'const' })
  })

  it('marks strings, and a comment marker inside one is not a comment', () => {
    const tokens = tokenize(`const url = "https://example.com"`, 'ts')

    expect(tokens.some((token) => token.kind === 'string' && token.text.includes('//'))).toBe(true)
    expect(tokens.some((token) => token.kind === 'comment')).toBe(false)
  })

  it('marks comments', () => {
    expect(tokenize('// why, not what', 'ts')[0]).toEqual({
      kind: 'comment',
      text: '// why, not what',
    })
  })

  it('marks numbers', () => {
    expect(tokenize('42', 'ts')).toEqual([{ kind: 'number', text: '42' }])
  })

  it('joins ordinary identifiers into one run rather than one span per word', () => {
    const plain = tokenize('foo bar baz', 'ts').filter((token) => token.kind === 'plain')

    expect(plain).toHaveLength(1)
  })

  it('loses no character of the source, whatever it paints', () => {
    for (const source of [
      `const a = "x" // note`,
      `#!/bin/sh\necho "hi"`,
      '{"a": 1, "b": null}',
      '.a { color: red; }',
      '',
    ]) {
      const rebuilt = tokenize(source, 'ts')
        .map((token) => token.text)
        .join('')

      expect(rebuilt, source).toBe(source)
    }
  })

  it('never loops forever on a character it cannot classify', () => {
    expect(
      tokenize('«»§±', 'ts')
        .map((token) => token.text)
        .join(''),
    ).toBe('«»§±')
  })
})
