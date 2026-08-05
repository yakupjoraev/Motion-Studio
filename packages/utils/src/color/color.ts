import { ERROR_CODES, MotionStudioError } from '../errors/errors'

/** Lightness 0–1, chroma in absolute OKLCH units, hue in degrees 0–360, alpha 0–1. */
export interface Oklch {
  readonly l: number
  readonly c: number
  readonly h: number
  readonly a: number
}

interface LinearRgb {
  readonly r: number
  readonly g: number
  readonly b: number
}

const HEX = /^#([0-9a-f]{3,8})$/i
const OKLCH_CALL = /^oklch\(\s*(.*?)\s*\)$/i

/**
 * Output precision. An 8-bit sRGB channel steps by 1/255, roughly 0.4 % of lightness, so two decimals
 * of a percentage resolve ~40× finer than anything a standard display shows. Chroma spans 0–0.4 in
 * practice, so four decimals are likewise below the rendered step. Fixing the precision is what keeps
 * the ~120 theme variables in `THEME_ENGINE.md` § Application byte-stable between runs.
 */
const LIGHTNESS_DECIMALS = 2
const CHROMA_DECIMALS = 4
const HUE_DECIMALS = 2

function invalidColor(input: string): MotionStudioError {
  return new MotionStudioError(`Unrecognised colour: ${input}`, ERROR_CODES.invalidColor)
}

/**
 * Total by construction: an index past the end yields an empty string, which every numeric parse below
 * turns into `NaN` for the single validity check to reject. `oklch(58%)` reaches this.
 */
function tokenAt(tokens: readonly string[], index: number): string {
  return tokens[index] ?? ''
}

/** Reads a number that may be written as a percentage, returning 0–1 for the percentage form. */
function parseFraction(token: string): number {
  const isPercentage = token.endsWith('%')
  const value = Number.parseFloat(isPercentage ? token.slice(0, -1) : token)

  return isPercentage ? value / 100 : value
}

function srgbToLinear(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

/** Ottosson's linear-sRGB → OKLab matrices, then OKLab's rectangular form to polar. */
function linearRgbToOklch(rgb: LinearRgb, alpha: number): Oklch {
  const long = Math.cbrt(0.4122214708 * rgb.r + 0.5363325363 * rgb.g + 0.0514459929 * rgb.b)
  const medium = Math.cbrt(0.2119034982 * rgb.r + 0.6806995451 * rgb.g + 0.1073969566 * rgb.b)
  const short = Math.cbrt(0.0883024619 * rgb.r + 0.2817188376 * rgb.g + 0.6299787005 * rgb.b)

  const l = 0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short
  const labA = 1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short
  const labB = 0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short
  const hue = (Math.atan2(labB, labA) * 180) / Math.PI

  return { l, c: Math.hypot(labA, labB), h: hue < 0 ? hue + 360 : hue, a: alpha }
}

/** The inverse. Channels may fall outside 0–1, which is what "out of gamut" means. */
function oklchToLinearRgb(color: Oklch): LinearRgb {
  const radians = (color.h * Math.PI) / 180
  const labA = color.c * Math.cos(radians)
  const labB = color.c * Math.sin(radians)

  const long = (color.l + 0.3963377774 * labA + 0.2158037573 * labB) ** 3
  const medium = (color.l - 0.1055613458 * labA - 0.0638541728 * labB) ** 3
  const short = (color.l - 0.0894841775 * labA - 1.291485548 * labB) ** 3

  return {
    r: 4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    g: -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    b: -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
  }
}

function hexByte(digits: string, index: number): number {
  return Number.parseInt(digits.slice(index, index + 2), 16) / 255
}

function parseHex(digits: string): Oklch | undefined {
  const expanded =
    digits.length === 3 || digits.length === 4
      ? [...digits].map((digit) => digit + digit).join('')
      : digits

  if (expanded.length !== 6 && expanded.length !== 8) {
    return undefined
  }

  return linearRgbToOklch(
    {
      r: srgbToLinear(hexByte(expanded, 0)),
      g: srgbToLinear(hexByte(expanded, 2)),
      b: srgbToLinear(hexByte(expanded, 4)),
    },
    expanded.length === 8 ? hexByte(expanded, 6) : 1,
  )
}

function parseOklchCall(body: string): Oklch | undefined {
  const parts = body.split('/')
  const tokens = tokenAt(parts, 0).trim().split(/\s+/)

  const color: Oklch = {
    l: parseFraction(tokenAt(tokens, 0)),
    c: Number.parseFloat(tokenAt(tokens, 1)),
    h: Number.parseFloat(tokenAt(tokens, 2)),
    a: parts.length > 1 ? parseFraction(tokenAt(parts, 1)) : 1,
  }

  if (
    tokens.length !== 3 ||
    Number.isNaN(color.l) ||
    Number.isNaN(color.c) ||
    Number.isNaN(color.h) ||
    Number.isNaN(color.a)
  ) {
    return undefined
  }

  return color
}

/**
 * Accepts `oklch(58% 0.18 285)`, `oklch(0.58 0.18 285 / 0.5)`, and hex in its 3-, 4-, 6-, and 8-digit
 * forms. Throws rather than returning a `Result`: `THEME_ENGINE.md` § Palette generation destructures
 * the return value directly, and an unparseable seed there is a data error, not a user-facing one.
 */
export function parseOklch(input: string): Oklch {
  const trimmed = input.trim()
  const hex = HEX.exec(trimmed)
  const call = OKLCH_CALL.exec(trimmed)

  const parsed = hex === null ? parseOklchCall(tokenAt(call ?? [], 1)) : parseHex(tokenAt(hex, 1))

  if (parsed === undefined) {
    throw invalidColor(trimmed)
  }

  return parsed
}

/** Emits the CSS form. Alpha is omitted at 1, so the common case stays short. */
export function formatOklch(l: number, c: number, h: number, a = 1): string {
  const lightness = (l * 100).toFixed(LIGHTNESS_DECIMALS)
  const base = `oklch(${lightness}% ${c.toFixed(CHROMA_DECIMALS)} ${h.toFixed(HUE_DECIMALS)}`

  return a >= 1 ? `${base})` : `${base} / ${a})`
}

/** WCAG 2.x relative luminance, computed on linearised sRGB channels. */
export function relativeLuminance(color: string): number {
  const rgb = oklchToLinearRgb(parseOklch(color))

  return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b
}

/** WCAG 2.x contrast ratio, 1–21. Symmetric in its arguments. */
export function contrastRatio(a: string, b: string): number {
  const first = relativeLuminance(a)
  const second = relativeLuminance(b)

  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

/**
 * Tolerance on the gamut test: a fifth of one 8-bit step. Tighter would reject colours that render
 * identically to an in-gamut neighbour; looser would let a visibly clipped one through.
 */
const GAMUT_EPSILON = 1 / 255 / 5

function isInGamut(color: Oklch): boolean {
  const rgb = oklchToLinearRgb(color)

  return [rgb.r, rgb.g, rgb.b].every(
    (channel) => channel >= -GAMUT_EPSILON && channel <= 1 + GAMUT_EPSILON,
  )
}

/**
 * The largest chroma at or below `c` that stays inside the sRGB gamut at that lightness and hue.
 * Without it, mid-tones of a saturated hue clip to flat blocks on displays with no wide-gamut output —
 * `THEME_ENGINE.md` § Palette generation, detail 1.
 *
 * 24 bisections over a range no wider than 0.4 resolve to under 2.4e-8, four orders of magnitude below
 * the 8-bit step the result renders at, so the loop count is fixed rather than tolerance driven.
 */
export function clampChroma(c: number, l: number, h: number): number {
  if (isInGamut({ l, c, h, a: 1 })) {
    return c
  }

  let low = 0
  let high = c

  for (let step = 0; step < 24; step += 1) {
    const middle = (low + high) / 2

    if (isInGamut({ l, c: middle, h, a: 1 })) {
      low = middle
    } else {
      high = middle
    }
  }

  return low
}
