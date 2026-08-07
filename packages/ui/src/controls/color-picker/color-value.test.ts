import { contrastRatio, parseOklch } from '@motion-studio/utils'
import { describe, expect, it } from 'vitest'

import { contrastReadout, fromHex, isHex, resolve, speakColor, toHex } from './color-value'

import type { ColorTokenPreset } from './color-picker.types'

const TOKENS: readonly ColorTokenPreset[] = [
  { token: 'accent', label: 'Accent', value: 'oklch(58% 0.18 285)' },
  { token: 'surface-1', label: 'Panel', value: 'oklch(98% 0 0)' },
]

describe('isHex', () => {
  it.each(['#fff', '#ffff', '#ff0000', '#ff0000cc', '  #FF0000  '])('accepts %s', (input) => {
    expect(isHex(input)).toBe(true)
  })

  it.each(['#ff', '#fffff', '#fffffff', 'ff0000', 'red', 'oklch(58% 0.18 285)', ''])(
    'rejects %s',
    (input) => {
      expect(isHex(input)).toBe(false)
    },
  )
})

describe('hex conversion', () => {
  it('round-trips a colour through the hex form React Aria needs', () => {
    const original = parseOklch('oklch(58% 0.18 285)')
    const back = parseOklch(fromHex(toHex('oklch(58% 0.18 285)')))

    // 8-bit sRGB is the intermediate, so equality is to within one channel step.
    expect(back.l).toBeCloseTo(original.l, 2)
    expect(back.h).toBeCloseTo(original.h, 0)
  })

  it('carries alpha into the eight-digit form', () => {
    expect(toHex('oklch(58% 0.18 285 / 0.5)')).toHaveLength(9)
  })
})

describe('resolve', () => {
  it('returns a literal as it stands', () => {
    expect(resolve({ kind: 'color', color: 'oklch(50% 0 0)' })).toBe('oklch(50% 0 0)')
  })

  it('looks a token up in the presets it was given', () => {
    expect(resolve({ kind: 'token', token: 'accent' }, TOKENS)).toBe('oklch(58% 0.18 285)')
  })

  it('reports a token this theme does not have rather than inventing a colour', () => {
    expect(resolve({ kind: 'token', token: 'brand' }, TOKENS)).toBeNull()
  })
})

describe('speakColor', () => {
  it('names a token and then reads the numbers, as § Inspector words it', () => {
    expect(speakColor({ kind: 'token', token: 'accent' }, TOKENS)).toBe(
      'Accent, oklch 58% 0.18 285',
    )
  })

  it('reads a literal as numbers alone', () => {
    expect(speakColor({ kind: 'color', color: 'oklch(58% 0.18 285)' })).toBe('oklch 58% 0.18 285')
  })

  it('says how opaque a translucent colour is', () => {
    expect(speakColor({ kind: 'color', color: 'oklch(58% 0.18 285 / 0.5)' })).toContain(
      '50% opaque',
    )
  })

  it('says a missing token is missing', () => {
    expect(speakColor({ kind: 'token', token: 'brand' }, TOKENS)).toBe('brand, not in this theme')
  })
})

describe('contrastReadout', () => {
  it('reports the ratio contrastRatio computes', () => {
    const readout = contrastReadout('oklch(0% 0 0)', 'oklch(100% 0 0)')

    expect(readout.ratio).toBeCloseTo(contrastRatio('oklch(0% 0 0)', 'oklch(100% 0 0)'), 0)
    expect(readout.ratio).toBe(21)
  })

  it.each([
    ['oklch(0% 0 0)', 'oklch(100% 0 0)', 'AAA'],
    ['oklch(100% 0 0)', 'oklch(100% 0 0)', 'fail'],
  ])('grades %s on %s as %s', (foreground, background, level) => {
    expect(contrastReadout(foreground, background).level).toBe(level)
  })

  it('announces the verdict rather than only the number', () => {
    expect(contrastReadout('oklch(0% 0 0)', 'oklch(100% 0 0)').text).toBe(
      'Contrast 21.0 to 1, passes AAA',
    )
    expect(contrastReadout('oklch(100% 0 0)', 'oklch(100% 0 0)').text).toBe(
      'Contrast 1.0 to 1, fails AA',
    )
  })
})
