import type { FontValue } from './font-field.types'

/**
 * A declaration list rather than one value — ADR-045. The `font` shorthand cannot carry
 * `letter-spacing`, so the four properties this control edits are four declarations, and that list is
 * what round-trips.
 */
export function toCss(value: FontValue): string {
  return [
    `font-family: ${value.family}`,
    `font-size: ${value.size}px`,
    `font-weight: ${value.weight}`,
    `letter-spacing: ${value.tracking}em`,
  ].join('; ')
}

const NUMBER = /^(-?[\d.]+)(px|em)?$/

function declarations(input: string): Map<string, string> {
  const entries = new Map<string, string>()

  for (const part of input.split(';')) {
    const colon = part.indexOf(':')

    if (colon > 0) {
      entries.set(part.slice(0, colon).trim().toLowerCase(), part.slice(colon + 1).trim())
    }
  }

  return entries
}

function numberOf(entries: Map<string, string>, property: string): number {
  return Number.parseFloat(NUMBER.exec(entries.get(property) ?? '')?.[1] ?? '')
}

/**
 * The grammar `toCss` emits, plus whitespace and ordering tolerance. `null` when a declaration is
 * missing or is not a number where one belongs — ADR-040: a value this module would not have written is
 * reported rather than guessed at.
 */
export function fromCss(input: string): FontValue | null {
  const entries = declarations(input)
  const family = entries.get('font-family') ?? ''
  const size = numberOf(entries, 'font-size')
  const weight = numberOf(entries, 'font-weight')
  const tracking = numberOf(entries, 'letter-spacing')

  if (family === '' || Number.isNaN(size) || Number.isNaN(weight) || Number.isNaN(tracking)) {
    return null
  }

  return { family, size, weight, tracking }
}
