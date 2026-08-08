/**
 * Layer 5: the value is re-emitted in one spelling, so two documents that mean the same thing
 * serialise the same way and a diff shows real edits. Normalising *after* the checks is deliberate —
 * normalising first would let a payload be rewritten into something the blocklist no longer sees.
 */
export function normalizeCssValue(value: string): string {
  let result = ''
  let quote: '"' | "'" | null = null
  let pendingSpace = false

  for (const character of value.trim()) {
    if (quote !== null) {
      result += character

      if (character === quote) {
        quote = null
      }

      continue
    }

    if (character === '"' || character === "'") {
      quote = character
      result += character
      continue
    }

    if (/\s/.test(character)) {
      pendingSpace = result.length > 0
      continue
    }

    if (pendingSpace && !',)'.includes(character) && !result.endsWith('(')) {
      result += ' '
    }

    pendingSpace = false
    result += character
  }

  return result
}
