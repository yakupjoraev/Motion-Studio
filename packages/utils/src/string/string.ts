/**
 * Splits an identifier into lowercase words, whatever convention it arrived in. Handles camelCase,
 * PascalCase, kebab-case, snake_case, spaces, and the `HTTPRequest` acronym boundary, so the three
 * case converters below share one notion of where a word ends.
 */
function words(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter((word) => word.length > 0)
    .map((word) => word.toLowerCase())
}

export function kebab(input: string): string {
  return words(input).join('-')
}

export function camel(input: string): string {
  return words(input)
    .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join('')
}

export function pascal(input: string): string {
  return words(input)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

/**
 * Turns an identifier or a property path into a label for the UI. `EDITOR_ENGINE.md` § Commands uses
 * it for the undo label of a prop edit, so `plans[0].price` has to read as `Plans 0 price` rather
 * than keeping its punctuation.
 */
export function humanize(input: string): string {
  const spaced = words(input).join(' ')

  return spaced.length === 0 ? '' : spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/**
 * Shortens to at most `maxLength` characters *including* the ellipsis, so the result never exceeds
 * the budget a caller sized a column for. A `maxLength` below the ellipsis length returns a
 * truncated ellipsis rather than overflowing.
 */
export function truncate(input: string, maxLength: number, ellipsis = '…'): string {
  if (input.length <= maxLength) {
    return input
  }

  if (maxLength <= ellipsis.length) {
    return ellipsis.slice(0, Math.max(0, maxLength))
  }

  return input.slice(0, maxLength - ellipsis.length) + ellipsis
}

/**
 * Escapes the five characters that can break out of HTML text or an attribute value. Used by the HTML
 * printer in `EXPORT_ENGINE.md`, where the input is user-authored document text.
 *
 * `&` goes first and the order matters: run it later and it would escape the ampersands the other
 * four replacements just introduced, turning `<` into `&amp;lt;`.
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
