import { describe, expect, it } from 'vitest'

import { MALICIOUS_CSS, SAFE_CSS } from './__fixtures__/malicious'
import { MAX_VALUE_LENGTH, findStructuralErrors, positionAt, splitDeclarations } from './structural'

const first = (value: string) => findStructuralErrors(value)[0]

describe('positionAt', () => {
  it('counts lines from one and columns from one', () => {
    expect(positionAt('abc', 0)).toEqual({ line: 1, column: 1 })
    expect(positionAt('abc', 2)).toEqual({ line: 1, column: 3 })
  })

  it('restarts the column on a new line', () => {
    expect(positionAt('ab\ncd', 4)).toEqual({ line: 2, column: 2 })
  })
})

describe('delimiters', () => {
  it.each(Object.values(SAFE_CSS))('accepts %s', (value) => {
    expect(findStructuralErrors(value)).toEqual([])
  })

  it('reports an unclosed paren where it was opened, and counts both ends', () => {
    const error = first(MALICIOUS_CSS.unbalancedParen)

    expect(error?.message).toContain('1 open parens, 0 closing')
    expect(error).toMatchObject({ line: 1, column: 4, layer: 'structural' })
  })

  it('reports a stray closing paren at the character that was unexpected', () => {
    const error = first(MALICIOUS_CSS.strayParen)

    expect(error?.message).toContain("Unexpected ')' — 1 open parens, 2 closing")
    expect(error?.column).toBe(13)
  })

  it('reports an unclosed bracket', () => {
    expect(first(MALICIOUS_CSS.unbalancedBracket)?.message).toContain('1 open brackets, 0 closing')
  })

  it('names the opener a mismatched closer left waiting', () => {
    expect(first('rgb(0, 0, 0]')?.message).toContain("the '(' at line 1 column 4 is still open")
  })

  it('finds the imbalance on the line it is on', () => {
    expect(first('linear-gradient(\n  red,\n  blue')).toMatchObject({ line: 1, column: 16 })
  })

  it('does not mistake a parenthesis inside a string for structure', () => {
    expect(findStructuralErrors('"("')).toEqual([])
  })

  it('reports an unterminated string at the quote that opened it', () => {
    const error = first(MALICIOUS_CSS.unterminatedString)

    expect(error?.message).toBe('Unclosed double quote.')
    expect(error?.column).toBe(5)
  })
})

describe('what a value is not', () => {
  it('refuses a top-level semicolon, which ends a declaration', () => {
    expect(first(MALICIOUS_CSS.semicolon)?.message).toContain('semicolon')
  })

  it('allows a semicolon inside a call, because a data URL carries one', () => {
    expect(findStructuralErrors(SAFE_CSS.dataImage)).toEqual([])
  })

  it('refuses a top-level colon, which means a declaration never ended', () => {
    expect(first('red\nopacity: 0.5')?.message).toContain("end the declaration before it with ';'")
  })

  it('allows a colon inside a call, where a data URL keeps one', () => {
    expect(findStructuralErrors('url(data:image/png;base64,AAA)')).toEqual([])
  })

  it('refuses braces', () => {
    expect(first(MALICIOUS_CSS.brace)?.message).toContain('braces')
  })

  it('refuses a comment, which is how a payload hides from a pattern', () => {
    expect(first(MALICIOUS_CSS.comment)?.message).toContain('Comments')
  })

  it('refuses a backslash outside a string', () => {
    expect(first(MALICIOUS_CSS.escape)?.message).toContain('backslash')
  })

  it('allows a backslash inside a string, where it spells text — ADR-270', () => {
    expect(findStructuralErrors('"\\201C"')).toEqual([])
  })

  it('caps the length and points past the cap', () => {
    const error = first(MALICIOUS_CSS.tooLong)

    expect(error?.message).toContain(`cap is ${MAX_VALUE_LENGTH}`)
    expect(error?.column).toBe(MAX_VALUE_LENGTH + 1)
  })
})

describe('splitDeclarations', () => {
  it('splits on the semicolons that end a declaration', () => {
    const { declarations } = splitDeclarations('color: red; opacity: 0.5')

    expect(declarations.map((entry) => entry.property)).toEqual(['color', 'opacity'])
    expect(declarations[1]?.value).toBe('0.5')
  })

  it('ignores a trailing semicolon and blank lines', () => {
    expect(splitDeclarations('color: red;\n\n').declarations).toHaveLength(1)
  })

  it('does not split inside a data URL', () => {
    const { declarations } = splitDeclarations('mask-image: url(data:image/png;base64,AAA)')

    expect(declarations).toHaveLength(1)
    expect(declarations[0]?.value).toBe('url(data:image/png;base64,AAA)')
  })

  it('records where the property and the value were written', () => {
    const { declarations } = splitDeclarations('color: red;\nopacity: 0.5')

    expect(declarations[1]?.position).toEqual({ line: 2, column: 1 })
    expect(declarations[1]?.valuePosition).toEqual({ line: 2, column: 10 })
  })

  it('reports a line with no colon on that line', () => {
    const { errors } = splitDeclarations('color: red;\nopacity 0.5')

    expect(errors[0]).toMatchObject({ line: 2, column: 1, message: 'Expected `property: value`.' })
  })
})
