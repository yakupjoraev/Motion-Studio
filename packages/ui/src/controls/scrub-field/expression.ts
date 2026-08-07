type Token =
  | { readonly kind: 'number'; readonly value: number }
  | { readonly kind: 'operator'; readonly value: string }

interface Cursor {
  readonly tokens: readonly Token[]
  position: number
}

const OPERATORS = new Set(['+', '-', '*', '/', '(', ')'])
const NUMBER = /^(?:\d+\.?\d*|\.\d+)/

/** Whitespace, digits, a decimal point and the six operator characters. Anything else fails the input. */
function tokenize(input: string): Token[] | null {
  const tokens: Token[] = []
  let index = 0

  while (index < input.length) {
    const char = input.charAt(index)

    if (char === ' ' || char === '\t') {
      index += 1
    } else if (OPERATORS.has(char)) {
      tokens.push({ kind: 'operator', value: char })
      index += 1
    } else {
      const digits = NUMBER.exec(input.slice(index))

      if (digits === null) {
        return null
      }

      tokens.push({ kind: 'number', value: Number.parseFloat(digits[0]) })
      index += digits[0].length
    }
  }

  return tokens
}

function peek(cursor: Cursor): Token | undefined {
  return cursor.tokens[cursor.position]
}

function eat(cursor: Cursor, value: string): boolean {
  const token = peek(cursor)

  if (token?.kind === 'operator' && token.value === value) {
    cursor.position += 1

    return true
  }

  return false
}

function parseFactor(cursor: Cursor): number | null {
  if (eat(cursor, '-')) {
    const operand = parseFactor(cursor)

    return operand === null ? null : -operand
  }

  if (eat(cursor, '+')) {
    return parseFactor(cursor)
  }

  if (eat(cursor, '(')) {
    const inner = parseExpression(cursor)

    return inner !== null && eat(cursor, ')') ? inner : null
  }

  const token = peek(cursor)

  if (token?.kind !== 'number') {
    return null
  }

  cursor.position += 1

  return token.value
}

function parseTerm(cursor: Cursor): number | null {
  let left = parseFactor(cursor)

  while (left !== null) {
    const times = eat(cursor, '*')

    if (!times && !eat(cursor, '/')) {
      return left
    }

    const right = parseFactor(cursor)

    left = right === null ? null : times ? left * right : left / right
  }

  return left
}

function parseExpression(cursor: Cursor): number | null {
  let left = parseTerm(cursor)

  while (left !== null) {
    const plus = eat(cursor, '+')

    if (!plus && !eat(cursor, '-')) {
      return left
    }

    const right = parseTerm(cursor)

    left = right === null ? null : plus ? left + right : left - right
  }

  return left
}

/**
 * Four operators, parentheses and unary sign, over decimal literals. `null` for anything else — an
 * unparseable field reverts rather than throwing, and there is no path from a typed string to
 * execution: `eval` and `new Function` are not what evaluates this, a recursive descent over a token
 * list is.
 *
 * Division by zero produces `Infinity`, which fails the finite check and reads as invalid input.
 */
export function evaluateExpression(input: string): number | null {
  const tokens = tokenize(input.trim())

  if (tokens === null || tokens.length === 0) {
    return null
  }

  const cursor: Cursor = { tokens, position: 0 }
  const result = parseExpression(cursor)

  if (result === null || cursor.position !== tokens.length || !Number.isFinite(result)) {
    return null
  }

  return result
}
