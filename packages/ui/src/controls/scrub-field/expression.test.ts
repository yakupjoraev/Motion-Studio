import { describe, expect, it } from 'vitest'

import { evaluateExpression } from './expression'

describe('evaluateExpression', () => {
  it.each([
    ['16', 16],
    ['16*2', 32],
    ['100/3', 100 / 3],
    ['8+4', 12],
    ['12-4', 8],
    ['0.5', 0.5],
    ['.5', 0.5],
    ['-8', -8],
    ['+8', 8],
    ['--8', 8],
  ])('evaluates %s', (input, expected) => {
    expect(evaluateExpression(input)).toBeCloseTo(expected, 10)
  })

  it('applies multiplication before addition', () => {
    expect(evaluateExpression('2+3*4')).toBe(14)
  })

  it('applies division before subtraction', () => {
    expect(evaluateExpression('10-8/4')).toBe(8)
  })

  it('honours parentheses over precedence', () => {
    expect(evaluateExpression('(2+3)*4')).toBe(20)
    expect(evaluateExpression('((8))')).toBe(8)
  })

  it('associates subtraction and division to the left', () => {
    expect(evaluateExpression('10-3-2')).toBe(5)
    expect(evaluateExpression('100/5/2')).toBe(10)
  })

  it('ignores whitespace', () => {
    expect(evaluateExpression('  16 * 2  ')).toBe(32)
  })

  it.each([
    ['', 'empty'],
    ['   ', 'whitespace only'],
    ['16*', 'trailing operator'],
    ['*16', 'leading operator'],
    ['(16', 'unclosed parenthesis'],
    ['16)', 'unopened parenthesis'],
    ['16 16', 'two numbers with no operator'],
    ['16px', 'a unit'],
    ['1/0', 'division by zero'],
    ['0/0', 'zero over zero'],
  ])('rejects %s (%s) without throwing', (input) => {
    expect(() => evaluateExpression(input)).not.toThrow()
    expect(evaluateExpression(input)).toBeNull()
  })

  it('does not execute code', () => {
    // The pair matters: `1+1` proves the parser is live, so `constructor` returning null is a
    // rejection rather than a parser that rejects everything.
    expect(evaluateExpression('1+1')).toBe(2)

    for (const attempt of [
      'constructor',
      'this.constructor',
      'globalThis',
      'process.exit(1)',
      '[].constructor.constructor("return 1")()',
      'alert(1)',
      '1;alert(1)',
    ]) {
      expect(evaluateExpression(attempt)).toBeNull()
    }
  })
})
