import { contrastRatio, formatHex, formatOklch, parseOklch, round } from '@motion-studio/utils'

import type { ColorTokenPreset, ColorValue } from './color-picker.types'

/** § ColorPicker: recent swatches are capped at twelve. The picker enforces the cap it renders. */
export const RECENT_LIMIT = 12

const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i

/** The digit counts `parseOklch` can read. A five- or seven-digit string is not a colour. */
export function isHex(input: string): boolean {
  return HEX.test(input.trim())
}

/** The React Aria colour hooks accept hex and nothing else — ADR-039. */
export function toHex(color: string): string {
  return formatHex(parseOklch(color))
}

export function fromHex(hex: string): string {
  const { l, c, h, a } = parseOklch(hex)

  return formatOklch(l, c, h, a)
}

/**
 * `null` for a token that is not in the preset row: the theme it came from is not the theme in front of
 * the user, and inventing a colour for it would hide that.
 */
export function resolve(
  value: ColorValue,
  tokens: readonly ColorTokenPreset[] = [],
): string | null {
  if (value.kind === 'color') {
    return value.color
  }

  return tokens.find((preset) => preset.token === value.token)?.value ?? null
}

function label(value: ColorValue, tokens: readonly ColorTokenPreset[]): string | null {
  if (value.kind === 'color') {
    return null
  }

  return tokens.find((preset) => preset.token === value.token)?.label ?? value.token
}

/**
 * `ACCESSIBILITY.md` § Inspector: "Accent, oklch 58% 0.18 285" — the name where there is one, and the
 * numbers rounded to what a designer would read out rather than to the storage precision.
 */
export function speakColor(value: ColorValue, tokens: readonly ColorTokenPreset[] = []): string {
  const resolved = resolve(value, tokens)
  const name = label(value, tokens)

  if (resolved === null) {
    return `${name ?? 'Unknown'}, not in this theme`
  }

  const { l, c, h, a } = parseOklch(resolved)
  const numbers = `oklch ${round(l * 100, 0)}% ${round(c, 2)} ${round(h, 0)}`
  const spoken = a >= 1 ? numbers : `${numbers}, ${round(a * 100, 0)}% opaque`

  return name === null ? spoken : `${name}, ${spoken}`
}

export type ContrastLevel = 'AAA' | 'AA' | 'fail'

export interface ContrastReadout {
  readonly ratio: number
  readonly level: ContrastLevel
  readonly text: string
}

/** WCAG 2.x thresholds for body text: 4.5 : 1 for AA, 7 : 1 for AAA. */
function levelOf(ratio: number): ContrastLevel {
  if (ratio >= 7) {
    return 'AAA'
  }

  return ratio >= 4.5 ? 'AA' : 'fail'
}

/** Announced as § Inspector words it: "Contrast 4.8 to 1, passes AA". */
export function contrastReadout(foreground: string, background: string): ContrastReadout {
  const ratio = round(contrastRatio(foreground, background), 1)
  const level = levelOf(ratio)
  const verdict = level === 'fail' ? 'fails AA' : `passes ${level}`

  return { ratio, level, text: `Contrast ${ratio.toFixed(1)} to 1, ${verdict}` }
}
