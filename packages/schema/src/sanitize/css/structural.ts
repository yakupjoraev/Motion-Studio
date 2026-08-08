/**
 * Layer 1 of the CSS validator: is this shaped like a declaration value at all? It runs before the
 * blocklist because an unbalanced string or comment is what lets a payload hide from a pattern: a
 * backslash escape and an interleaved comment both read as one construct to a browser and as noise to
 * a regex.
 */
export interface StructuralIssue {
  readonly kind:
    | 'too-long'
    | 'unbalanced-parens'
    | 'unterminated-string'
    | 'comment'
    | 'semicolon'
    | 'brace'
    | 'escape'
  readonly message: string
}

/** A declaration value, not a stylesheet. Anything near this length is a payload, not a style. */
export const MAX_VALUE_LENGTH = 2000

export function findStructuralIssues(value: string): readonly StructuralIssue[] {
  const issues: StructuralIssue[] = []

  if (value.length > MAX_VALUE_LENGTH) {
    issues.push({
      kind: 'too-long',
      message: `A value may be at most ${MAX_VALUE_LENGTH} characters`,
    })
  }

  if (value.includes('/*') || value.includes('*/')) {
    issues.push({ kind: 'comment', message: 'Comments are not allowed in a value' })
  }

  if (value.includes('\\')) {
    issues.push({
      kind: 'escape',
      message: 'Backslash escapes are not allowed: they can spell a blocked construct',
    })
  }

  if (value.includes('{') || value.includes('}')) {
    issues.push({ kind: 'brace', message: 'A value is a declaration, not a rule block' })
  }

  if (value.includes(';')) {
    issues.push({
      kind: 'semicolon',
      message: 'A value holds one declaration, so it has no semicolons',
    })
  }

  let depth = 0
  let quote: '"' | "'" | null = null

  for (const character of value) {
    if (quote !== null) {
      if (character === quote) {
        quote = null
      }

      continue
    }

    if (character === '"' || character === "'") {
      quote = character
      continue
    }

    if (character === '(') {
      depth += 1
    }

    if (character === ')') {
      depth -= 1

      if (depth < 0) {
        break
      }
    }
  }

  if (depth !== 0) {
    issues.push({ kind: 'unbalanced-parens', message: 'Parentheses are unbalanced' })
  }

  if (quote !== null) {
    issues.push({ kind: 'unterminated-string', message: 'A quoted string is not closed' })
  }

  return issues
}
