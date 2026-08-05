import { formatOklch } from '@motion-studio/utils'
import { describe, expect, it } from 'vitest'

import { studioDark, studioLight } from '../presets/index'
import { buildRamps } from './build-palette'
import { type AccentPair, repairContrast } from './repair-contrast'
import { resolveTheme } from './resolve-theme'

import type { ThemeConfig } from '../theme.types'

/**
 * `THEME_ENGINE.md` § Contrast repair, both halves: never silently override the user, never silently ship
 * a failing pair. The first is a report; the second is a warning when no step can fix it.
 */

/** Mid-lightness in dark mode is the documented crossover where no foreground clears 4.5 (ADR-019). */
const failingDark: ThemeConfig = {
  ...studioDark,
  id: 'failing-dark',
  palette: { ...studioDark.palette, accent: formatOklch(0.58, 0.2292, 285) },
}

describe('repairContrast', () => {
  it('reports nothing when the palette already passes', () => {
    const result = repairContrast('dark', buildRamps(studioDark.palette))

    expect(result.repairs).toEqual([])
    expect(result.warnings).toEqual([])
    expect(result.accentStep).toBe(400)
  })

  it('substitutes the nearest passing step and names it', () => {
    const result = repairContrast('dark', buildRamps(failingDark.palette))

    expect(result.accentStep).toBe(400)
    expect(result.repairs).toHaveLength(1)
    expect(result.repairs[0]?.step).toBe(400)
    expect(result.repairs[0]?.message).toContain('accent step 400')
  })

  it('records the measurement that failed and the one that replaced it', () => {
    const [repair] = repairContrast('dark', buildRamps(failingDark.palette)).repairs

    expect(repair?.token).toBe('foreground-onAccent')
    expect(repair?.against).toBe('accent')
    expect(repair?.required).toBe(4.5)
    expect(repair?.measured).toBeLessThan(4.5)
    expect(repair?.repaired).toBeGreaterThanOrEqual(4.5)
  })

  it('reports the accent that moved, not the token that failed', () => {
    // `foreground-onAccent` is a neutral step and does not change when the ladder does, so reporting it
    // would print the same value twice and tell the user nothing.
    const [repair] = repairContrast('dark', buildRamps(failingDark.palette)).repairs

    expect(repair?.from).not.toBe(repair?.to)
  })

  it('walks toward darker steps in light mode', () => {
    const failingLight: ThemeConfig = {
      ...studioLight,
      id: 'failing-light',
      // Pale and weak: white cannot sit on it, so the ladder has to descend.
      palette: { ...studioLight.palette, accent: formatOklch(0.86, 0.07, 285) },
    }
    const result = repairContrast('light', buildRamps(failingLight.palette))

    expect(result.repairs).toHaveLength(1)
    expect(result.accentStep).toBeGreaterThan(300)
  })

  it('warns instead of repairing when no step reaches the threshold', () => {
    // The seam exists so this guarantee is testable: 21:1 is the maximum possible ratio, so requiring it
    // of a pair that is not black on white cannot be met by any step.
    const impossible: readonly AccentPair[] = [['foreground-onAccent', 'accent', 21]]
    const result = repairContrast('dark', buildRamps(studioDark.palette), impossible)

    expect(result.repairs).toEqual([])
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toContain('no step of this accent ramp reaches it')
    expect(result.warnings[0]).toContain('lighter')
  })

  it('tells a light-mode user to go darker', () => {
    const impossible: readonly AccentPair[] = [['foreground-onAccent', 'accent', 21]]
    const result = repairContrast('light', buildRamps(studioLight.palette), impossible)

    expect(result.warnings[0]).toContain('darker')
  })

  it('leaves the accent step unchanged when it cannot repair', () => {
    const impossible: readonly AccentPair[] = [['foreground-onAccent', 'accent', 21]]
    const ramps = buildRamps(studioDark.palette)

    expect(repairContrast('dark', ramps, impossible).accentStep).toBe(ramps.accentStep)
  })
})

describe('resolveTheme carries the report', () => {
  it('surfaces repairs on the resolution', () => {
    const resolved = resolveTheme(failingDark)

    expect(resolved.repairs).toHaveLength(1)
    expect(resolved.warnings).toEqual([])
  })

  it('applies the repaired step to the variables it emits', () => {
    const resolved = resolveTheme(failingDark)
    const repaired = resolved.repairs[0]?.to

    expect(resolved.variables['--ms-color-accent']).toBe(repaired)
  })
})
