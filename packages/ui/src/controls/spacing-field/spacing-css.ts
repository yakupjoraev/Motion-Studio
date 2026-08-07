import type { SpacingValue } from './spacing-field.types'

const SIDES = ['top', 'right', 'bottom', 'left'] as const

/** Always the four-value form: the shorthand's collapsing rules are lossy in the other direction. */
export function toCss(value: SpacingValue, unit = 'px'): string {
  return SIDES.map((side) => `${value[side]}${unit}`).join(' ')
}

/**
 * The 1-, 2-, 3- and 4-value shorthand forms, which is what a stylesheet or a paste will contain.
 * `null` for anything else — ADR-040: a value `toCss` would never write is reported, not guessed at.
 */
export function fromCss(input: string): SpacingValue | null {
  const parts = input
    .trim()
    .split(/\s+/)
    .filter((part) => part !== '')
  const numbers = parts.map((part) => Number.parseFloat(part))

  if (numbers.length < 1 || numbers.length > 4 || numbers.some(Number.isNaN)) {
    return null
  }

  const [first = 0, second = first, third = first, fourth = second] = numbers

  return { top: first, right: second, bottom: third, left: fourth }
}
