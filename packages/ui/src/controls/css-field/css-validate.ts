/** A declaration the escape hatch refuses to pass through, and why. */
export interface CssIssue {
  /** 1-based, so it matches what a reader counts in the field. */
  readonly line: number
  readonly message: string
}

const DECLARATION = /^([a-z-]+)\s*:\s*(.+)$/i

/**
 * `@import` pulls a stylesheet off the network at render time and `url(` can do the same for an image or a
 * font. Neither belongs in a value the export engine inlines into a block.
 */
const REFUSED = [
  { pattern: /@import/i, message: '@import is not allowed here.' },
  { pattern: /expression\s*\(/i, message: 'expression() is not allowed here.' },
  { pattern: /javascript:/i, message: 'javascript: is not allowed here.' },
]

/**
 * The escape hatch's validator. Declarations only — no selectors, no at-rules — because the value is
 * spliced into one element's style and a selector there would silently do nothing.
 *
 * Not a CSS parser: a property name, a colon, a non-empty value, balanced parentheses, and the caller's
 * allow-list. What it cannot judge is whether the browser understands the property, which is why an
 * unknown-but-well-formed declaration passes.
 */
export function validateCss(input: string, properties?: readonly string[]): readonly CssIssue[] {
  const issues: CssIssue[] = []
  const allowed = properties === undefined ? null : new Set(properties)

  input.split('\n').forEach((raw, index) => {
    const line = index + 1
    const text = raw.replace(/;\s*$/, '').trim()

    if (text === '') {
      return
    }

    for (const refused of REFUSED) {
      if (refused.pattern.test(text)) {
        issues.push({ line, message: refused.message })

        return
      }
    }

    if (text.includes('{') || text.includes('}')) {
      issues.push({ line, message: 'Write declarations only, without selectors or braces.' })

      return
    }

    const declaration = DECLARATION.exec(text)
    const property = declaration?.[1]?.toLowerCase()

    if (property === undefined) {
      issues.push({ line, message: 'Expected `property: value`.' })

      return
    }

    if (allowed !== null && !allowed.has(property)) {
      issues.push({ line, message: `${property} is not editable here.` })

      return
    }

    const opens = (text.match(/\(/g) ?? []).length
    const closes = (text.match(/\)/g) ?? []).length

    if (opens !== closes) {
      issues.push({ line, message: 'Unbalanced parentheses.' })
    }
  })

  return issues
}
