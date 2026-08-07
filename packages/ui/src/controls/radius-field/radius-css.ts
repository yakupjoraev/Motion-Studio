import type { RadiusValue } from './radius-field.types'

const CORNERS = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'] as const

export function toCss(value: RadiusValue, unit = 'px'): string {
  return CORNERS.map((corner) => `${value[corner]}${unit}`).join(' ')
}

/** The same 1- to 4-value shorthand as spacing, read into corner order rather than side order. */
export function fromCss(input: string): RadiusValue | null {
  const parts = input
    .trim()
    .split(/\s+/)
    .filter((part) => part !== '')
  const numbers = parts.map((part) => Number.parseFloat(part))

  if (numbers.length < 1 || numbers.length > 4 || numbers.some(Number.isNaN)) {
    return null
  }

  const [first = 0, second = first, third = first, fourth = second] = numbers

  return { topLeft: first, topRight: second, bottomRight: third, bottomLeft: fourth }
}
