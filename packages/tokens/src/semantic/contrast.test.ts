import { contrastRatio } from '@motion-studio/utils'
import { describe, expect, it } from 'vitest'

import { COLOR_MODES, SEMANTIC } from './semantic'

import type { SemanticColorToken } from './semantic.types'

type Pair = readonly [SemanticColorToken, SemanticColorToken]

/**
 * `DESIGN_SYSTEM.md` § Contrast contract. Two explicit lists, walked in both modes, failing the build
 * on a violation.
 *
 * The lists are the pairs that actually occur in the product, not the cross-product of the token set —
 * a cross-product test asserts things like "the accent button fill against the popover it is not on"
 * and gets disabled the first time it blocks a legitimate change.
 *
 * If a pair fails here, the token moves, not the threshold and not the list.
 */
const TEXT_PAIRS: readonly Pair[] = [
  ['foreground', 'surface-0'],
  ['foreground', 'surface-1'],
  ['foreground', 'surface-2'],
  ['foreground', 'surface-3'],
  ['foreground', 'surface-inset'],
  ['foreground-muted', 'surface-0'],
  ['foreground-muted', 'surface-1'],
  ['foreground-muted', 'surface-2'],
  ['foreground-muted', 'surface-3'],
  ['foreground-subtle', 'surface-0'],
  ['foreground-subtle', 'surface-1'],
  ['foreground-subtle', 'surface-2'],
  ['foreground-subtle', 'surface-3'],
  ['foreground-onAccent', 'accent'],
  ['foreground-onAccent', 'accent-hover'],
  ['foreground-onAccent', 'accent-active'],
  ['accent-ring', 'surface-1'],
  ['accent-ring', 'surface-2'],
  ['accent-ring', 'surface-3'],
  ['success', 'surface-1'],
  ['success', 'success-muted'],
  ['warning', 'surface-1'],
  ['warning', 'warning-muted'],
  ['danger', 'surface-1'],
  ['danger', 'danger-muted'],
  ['info', 'surface-1'],
  ['info', 'info-muted'],
  ['foreground', 'accent-muted'],
  ['foreground', 'success-muted'],
  ['foreground', 'warning-muted'],
  ['foreground', 'danger-muted'],
  ['foreground', 'info-muted'],
]

const UI_PAIRS: readonly Pair[] = [
  ['accent-ring', 'surface-0'],
  ['accent-ring', 'surface-inset'],
  ['canvas-selection', 'canvas-bg'],
  ['canvas-guide', 'canvas-bg'],
  ['canvas-snap', 'canvas-bg'],
]

/**
 * The accent fill has to be identifiable against the surface it sits on — a primary button is
 * recognised by its fill, and § What is deliberately exempt covers hairlines and surface steps, not
 * fills. ADR-019 measured this: it is what rules out a dark ladder running toward the surfaces.
 */
const FILL_PAIRS: readonly Pair[] = [
  ['accent', 'surface-0'],
  ['accent', 'surface-1'],
  ['accent', 'surface-2'],
  ['accent', 'surface-3'],
  ['accent', 'surface-inset'],
  ['accent-hover', 'surface-3'],
  ['accent-active', 'surface-3'],
]

describe.each(COLOR_MODES)('%s mode', (mode) => {
  const tokens = SEMANTIC[mode]

  it.each(TEXT_PAIRS)('%s on %s is at least 4.5:1', (foreground, background) => {
    expect(contrastRatio(tokens[foreground], tokens[background])).toBeGreaterThanOrEqual(4.5)
  })

  it.each(UI_PAIRS)('%s on %s is at least 3:1', (foreground, background) => {
    expect(contrastRatio(tokens[foreground], tokens[background])).toBeGreaterThanOrEqual(3)
  })

  it.each(FILL_PAIRS)('%s reads as a fill on %s, at least 3:1', (fill, background) => {
    expect(contrastRatio(tokens[fill], tokens[background])).toBeGreaterThanOrEqual(3)
  })

  it('declares every key the interface requires, with no empty value', () => {
    for (const [token, value] of Object.entries(tokens)) {
      expect(value, token).toMatch(/^oklch\(/)
    }
  })
})

describe('the two modes are not one palette inverted', () => {
  it('sends the surface ladder in opposite directions', () => {
    // Light elevates toward white, dark toward lighter grey — so `surface-3` is the lightest
    // surface in dark and `surface-inset` the darkest, while light does the reverse.
    const light = SEMANTIC.light
    const dark = SEMANTIC.dark

    expect(contrastRatio(light['surface-inset'], light.foreground)).toBeLessThan(
      contrastRatio(light['surface-1'], light.foreground),
    )
    expect(contrastRatio(dark['surface-3'], dark.foreground)).toBeLessThan(
      contrastRatio(dark['surface-1'], dark.foreground),
    )
  })

  it('takes a different status step per mode', () => {
    expect(SEMANTIC.light.success).not.toBe(SEMANTIC.dark.success)
    expect(SEMANTIC.light.danger).not.toBe(SEMANTIC.dark.danger)
  })

  it('gives the accent ladder opposite directions, which is why onAccent differs per mode', () => {
    expect(SEMANTIC.light['foreground-onAccent']).not.toBe(SEMANTIC.dark['foreground-onAccent'])
  })
})

describe('canvas feedback', () => {
  it('keeps selection, guide and snap on three distinct hues', () => {
    for (const mode of COLOR_MODES) {
      const tokens = SEMANTIC[mode]
      const hues = new Set([
        tokens['canvas-selection'],
        tokens['canvas-guide'],
        tokens['canvas-snap'],
      ])

      expect(hues.size, mode).toBe(3)
    }
  })

  it('bakes the 50% hover alpha into the token rather than leaving it to call sites', () => {
    for (const mode of COLOR_MODES) {
      expect(SEMANTIC[mode]['canvas-hover'], mode).toContain('/ 0.5)')
    }
  })
})
