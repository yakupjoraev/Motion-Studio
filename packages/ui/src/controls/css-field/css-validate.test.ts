import { describe, expect, it } from 'vitest'

import { validateCss } from './css-validate'

describe('validateCss', () => {
  it('passes a well-formed declaration', () => {
    expect(validateCss('letter-spacing: -0.01em;')).toEqual([])
  })

  it('passes several lines, with or without semicolons', () => {
    expect(validateCss('color: red;\nopacity: 0.5\n\n')).toEqual([])
  })

  it('passes a property it has never heard of, having no way to judge it', () => {
    expect(validateCss('anchor-name: --card;')).toEqual([])
  })

  it('passes a value carrying nested function calls', () => {
    expect(validateCss('box-shadow: 0 0 8px color-mix(in oklab, red 10%, transparent);')).toEqual(
      [],
    )
  })

  it('reports a line with no colon, and says which line', () => {
    expect(validateCss('color: red;\nopacity 0.5')).toEqual([
      { line: 2, message: 'Expected `property: value`.' },
    ])
  })

  it('reports a declaration with no value', () => {
    expect(validateCss('color:')).toHaveLength(1)
  })

  it('reports a selector, which would silently do nothing here', () => {
    expect(validateCss('.card { color: red }')[0]?.message).toMatch(/declarations only/)
  })

  it.each(['@import url(evil.css);', 'width: expression(alert(1));', 'background: javascript:x'])(
    'refuses %s',
    (input) => {
      expect(validateCss(input)).toHaveLength(1)
    },
  )

  it('reports unbalanced parentheses', () => {
    expect(validateCss('transform: translateX(4px;')[0]?.message).toBe('Unbalanced parentheses.')
  })

  it('holds the caller to the properties it allowed', () => {
    expect(validateCss('color: red;', ['opacity'])).toEqual([
      { line: 1, message: 'color is not editable here.' },
    ])
  })

  it('allows a listed property whatever its case', () => {
    expect(validateCss('COLOR: red;', ['color'])).toEqual([])
  })

  it('reports every bad line rather than stopping at the first', () => {
    expect(validateCss('oops\nalso oops')).toHaveLength(2)
  })

  it('says nothing about an empty field', () => {
    expect(validateCss('')).toEqual([])
    expect(validateCss('\n\n  \n')).toEqual([])
  })
})
