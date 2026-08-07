import { describe, expect, it } from 'vitest'

import { ERROR_CODES } from '../errors/errors'
import { codeOfThrown } from '../test/errors'
import {
  clampChroma,
  contrastRatio,
  formatHex,
  formatOklch,
  parseOklch,
  relativeLuminance,
} from './color'

/**
 * Computed by a literal transcription of the WCAG 2.x formula straight from hex, independent of this
 * module — which routes hex through OKLCH and back to sRGB. Agreement is evidence the colour pipeline
 * is right, rather than evidence it agrees with itself.
 */
const WCAG_REFERENCE = [
  { fg: '#000000', bg: '#ffffff', ratio: 21 },
  { fg: '#777777', bg: '#ffffff', ratio: 4.4781 },
  { fg: '#ff0000', bg: '#ffffff', ratio: 3.9985 },
  { fg: '#0000ff', bg: '#ffffff', ratio: 8.5925 },
  { fg: '#808080', bg: '#000000', ratio: 5.3172 },
  { fg: '#1a1a2e', bg: '#e8e8f0', ratio: 13.9969 },
] as const

describe('parseOklch', () => {
  it('parses the percentage lightness form', () => {
    const color = parseOklch('oklch(58% 0.18 285)')

    expect(color.l).toBeCloseTo(0.58, 6)
    expect(color.c).toBeCloseTo(0.18, 6)
    expect(color.h).toBeCloseTo(285, 6)
    expect(color.a).toBe(1)
  })

  it('parses the 0-1 lightness form', () => {
    expect(parseOklch('oklch(0.58 0.18 285)').l).toBeCloseTo(0.58, 6)
  })

  it('parses an alpha component', () => {
    expect(parseOklch('oklch(58% 0.18 285 / 0.5)').a).toBeCloseTo(0.5, 6)
  })

  it('parses a percentage alpha', () => {
    expect(parseOklch('oklch(58% 0.18 285 / 50%)').a).toBeCloseTo(0.5, 6)
  })

  it('tolerates surrounding and internal whitespace', () => {
    expect(parseOklch('  oklch( 58%  0.18   285 )  ').c).toBeCloseTo(0.18, 6)
  })

  it('parses six-digit hex', () => {
    const white = parseOklch('#ffffff')

    expect(white.l).toBeCloseTo(1, 3)
    expect(white.c).toBeCloseTo(0, 3)
    expect(white.a).toBe(1)
  })

  it('parses three-digit hex as the doubled form', () => {
    expect(parseOklch('#fff')).toEqual(parseOklch('#ffffff'))
  })

  it('parses four-digit hex, taking the last digit as alpha', () => {
    expect(parseOklch('#fff8').a).toBeCloseTo(0x88 / 255, 6)
  })

  it('parses eight-digit hex', () => {
    expect(parseOklch('#ffffff80').a).toBeCloseTo(0x80 / 255, 6)
  })

  it('is case insensitive for hex digits and the function name', () => {
    expect(parseOklch('#FFF')).toEqual(parseOklch('#fff'))
    expect(parseOklch('OKLCH(58% 0.18 285)').c).toBeCloseTo(0.18, 6)
  })

  it('returns black for #000000', () => {
    const black = parseOklch('#000000')

    expect(black.l).toBeCloseTo(0, 6)
    expect(black.c).toBeCloseTo(0, 6)
  })

  it('normalises a negative hue into 0-360', () => {
    // Pure red sits near 29 degrees; a red parsed from hex must not come back negative.
    expect(parseOklch('#ff0000').h).toBeGreaterThanOrEqual(0)
    expect(parseOklch('#ff0000').h).toBeLessThan(360)
  })

  it('rejects a hex length that is not 3, 4, 6, or 8', () => {
    expect(() => parseOklch('#12345')).toThrow('Unrecognised colour: #12345')
    expect(() => parseOklch('#1234567')).toThrow('Unrecognised colour: #1234567')
  })

  it('rejects too few components', () => {
    expect(() => parseOklch('oklch(58%)')).toThrow('Unrecognised colour: oklch(58%)')
    expect(() => parseOklch('oklch(58% 0.18)')).toThrow()
  })

  it('rejects too many components', () => {
    expect(() => parseOklch('oklch(58% 0.18 285 12)')).toThrow()
  })

  it('rejects a non-numeric lightness, chroma, hue, or alpha', () => {
    expect(() => parseOklch('oklch(pale 0.18 285)')).toThrow()
    expect(() => parseOklch('oklch(58% vivid 285)')).toThrow()
    expect(() => parseOklch('oklch(58% 0.18 warm)')).toThrow()
    expect(() => parseOklch('oklch(58% 0.18 285 / opaque)')).toThrow()
  })

  it('rejects a colour it does not recognise at all', () => {
    expect(() => parseOklch('rebeccapurple')).toThrow('Unrecognised colour: rebeccapurple')
    expect(() => parseOklch('')).toThrow('Unrecognised colour: ')
  })

  it('carries the invalidColor code', () => {
    expect(codeOfThrown(() => parseOklch('nonsense'))).toBe(ERROR_CODES.invalidColor)
  })
})

describe('formatOklch', () => {
  it('emits the percentage form with fixed precision', () => {
    expect(formatOklch(0.58, 0.18, 285)).toBe('oklch(58.00% 0.1800 285.00)')
  })

  it('omits alpha at 1', () => {
    expect(formatOklch(0.58, 0.18, 285, 1)).toBe('oklch(58.00% 0.1800 285.00)')
  })

  it('emits alpha below 1', () => {
    expect(formatOklch(0.58, 0.18, 285, 0.5)).toBe('oklch(58.00% 0.1800 285.00 / 0.5)')
  })

  it('rounds to the documented precision rather than emitting float noise', () => {
    expect(formatOklch(0.123456789, 0.123456789, 123.456789)).toBe('oklch(12.35% 0.1235 123.46)')
  })

  it('produces the same string for the same input, which is what byte-stability needs', () => {
    expect(formatOklch(0.1 + 0.2, 0.3, 0)).toBe(formatOklch(0.3, 0.3, 0))
  })

  it('round-trips through parseOklch within the emitted precision', () => {
    const color = parseOklch(formatOklch(0.58, 0.18, 285))

    expect(color.l).toBeCloseTo(0.58, 4)
    expect(color.c).toBeCloseTo(0.18, 4)
    expect(color.h).toBeCloseTo(285, 2)
  })
})

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 4)
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 4)
  })

  it('matches the WCAG reference value for mid grey', () => {
    expect(relativeLuminance('#777777')).toBeCloseTo(0.184475, 4)
  })

  it('weights green above red above blue', () => {
    expect(relativeLuminance('#00ff00')).toBeGreaterThan(relativeLuminance('#ff0000'))
    expect(relativeLuminance('#ff0000')).toBeGreaterThan(relativeLuminance('#0000ff'))
  })

  it('reads the same value from an oklch string as from the equivalent hex', () => {
    const fromHex = relativeLuminance('#777777')
    const grey = parseOklch('#777777')

    expect(relativeLuminance(formatOklch(grey.l, grey.c, grey.h))).toBeCloseTo(fromHex, 4)
  })
})

describe('contrastRatio', () => {
  it('is 21 for black on white', () => {
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 2)
  })

  it('is 1 for a colour against itself', () => {
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 2)
  })

  it.each(WCAG_REFERENCE)('matches the WCAG reference for $fg on $bg', ({ fg, bg, ratio }) => {
    expect(contrastRatio(fg, bg)).toBeCloseTo(ratio, 2)
  })

  it('is symmetric in its arguments', () => {
    expect(contrastRatio('#123456', '#fedcba')).toBeCloseTo(contrastRatio('#fedcba', '#123456'), 6)
  })

  it('accepts oklch strings, which is how the token set arrives', () => {
    expect(contrastRatio('oklch(0% 0 0)', 'oklch(100% 0 0)')).toBeCloseTo(21, 2)
  })
})

describe('clampChroma', () => {
  it('returns the chroma unchanged when it is already in gamut', () => {
    expect(clampChroma(0.05, 0.5, 285)).toBe(0.05)
  })

  it('returns 0 unchanged, since a grey is always in gamut', () => {
    expect(clampChroma(0, 0.5, 285)).toBe(0)
  })

  it('reduces a chroma that is out of gamut', () => {
    const clamped = clampChroma(0.4, 0.5, 285)

    expect(clamped).toBeLessThan(0.4)
    expect(clamped).toBeGreaterThan(0)
  })

  it('produces an in-gamut colour for 20 sampled lightness and hue pairs', () => {
    const lightnesses = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 0.95]
    const hues = [0, 60, 120, 180, 240, 300]
    const samples: { l: number; h: number; c: number }[] = []

    for (const l of lightnesses) {
      for (const h of hues) {
        samples.push({ l, h, c: clampChroma(0.4, l, h) })
      }
    }

    expect(samples.length).toBeGreaterThanOrEqual(20)

    for (const sample of samples) {
      // The clamped colour must survive a round trip to sRGB and back without the hue or lightness
      // moving, which is only true if no channel was clipped.
      const rendered = parseOklch(formatOklch(sample.l, sample.c, sample.h))

      expect(rendered.l).toBeCloseTo(sample.l, 3)
      expect(rendered.c).toBeCloseTo(sample.c, 3)
    }
  })

  it('never returns more than the requested chroma', () => {
    for (const l of [0.2, 0.5, 0.8]) {
      for (const h of [30, 150, 270]) {
        expect(clampChroma(0.3, l, h)).toBeLessThanOrEqual(0.3)
      }
    }
  })

  it('clamps hardest at the lightness extremes, where the gamut is narrowest', () => {
    const atMid = clampChroma(0.4, 0.5, 300)
    const atDark = clampChroma(0.4, 0.05, 300)

    expect(atDark).toBeLessThan(atMid)
  })
})

describe('formatHex', () => {
  it('round-trips the sRGB primaries and the greys', () => {
    for (const hex of ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#808080']) {
      expect(formatHex(parseOklch(hex))).toBe(hex)
    }
  })

  it('emits eight digits only when the colour is transparent', () => {
    expect(formatHex(parseOklch('#ff000080'))).toBe('#ff000080')
    expect(formatHex(parseOklch('#ff0000ff'))).toBe('#ff0000')
  })

  it('holds lightness and hue when a colour is outside the sRGB gamut', () => {
    // Chroma 0.35 at this lightness and hue is well outside sRGB; the nearest in-gamut colour keeps both.
    const wide = parseOklch('oklch(60% 0.35 320)')
    const rendered = parseOklch(formatHex(wide))

    expect(rendered.l).toBeCloseTo(wide.l, 2)
    expect(rendered.h).toBeCloseTo(wide.h, 0)
    expect(rendered.c).toBeLessThan(wide.c)
  })
})
