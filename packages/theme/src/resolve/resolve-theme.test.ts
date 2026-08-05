import { BLUR, DURATION, EASING, LIGHT, RADIUS, SPACE, TYPE_SCALE } from '@motion-studio/tokens'
import { beforeEach, describe, expect, it } from 'vitest'

import { studioDark, studioLight } from '../presets/index'
import { clearThemeCache, resolveTheme } from './resolve-theme'

import type { ThemeConfig } from '../theme.types'

/**
 * The variable set is asserted against the token tables rather than against a literal count, so adding a
 * token to `packages/tokens` fails here until the engine emits it. A hard-coded number would pass forever
 * while the set silently fell behind.
 */
const EXPECTED_KEYS = (): string[] => [
  ...Object.keys(LIGHT).map((token) => `--ms-color-${token}`),
  ...Object.keys(RADIUS).map((token) => `--ms-radius-${token}`),
  ...Object.keys(SPACE).map((token) => `--ms-space-${token}`),
  '--ms-font-sans',
  '--ms-font-display',
  '--ms-font-mono',
  '--ms-font-size-base',
  '--ms-font-scale-ratio',
  ...Object.keys(TYPE_SCALE).flatMap((token) => [
    `--ms-text-${token}`,
    `--ms-text-${token}-line-height`,
    `--ms-text-${token}-tracking`,
  ]),
  ...['xs', 'sm', 'md', 'lg', 'xl', '2xl'].map((level) => `--ms-shadow-${level}`),
  '--ms-shadow-focus',
  '--ms-shadow-glow-accent',
  ...Object.keys(BLUR).map((token) => `--ms-blur-${token}`),
  '--ms-motion-scale',
  ...Object.keys(DURATION).map((token) => `--ms-duration-${token}`),
  ...Object.keys(EASING).map((token) => `--ms-ease-${token}`),
  '--ms-glass-backdrop-filter',
  '--ms-glass-background',
  '--ms-glass-border',
  '--ms-noise-opacity',
  '--ms-border-width',
]

beforeEach(() => {
  clearThemeCache()
})

describe('the variable set', () => {
  it('carries exactly the keys the token groups define', () => {
    const resolved = resolveTheme(studioDark)

    expect(Object.keys(resolved.variables).sort()).toEqual([...EXPECTED_KEYS()].sort())
  })

  it('carries 141 variables, which is the count that key set comes to', () => {
    expect(Object.keys(resolveTheme(studioDark).variables)).toHaveLength(EXPECTED_KEYS().length)
    expect(EXPECTED_KEYS()).toHaveLength(141)
  })

  it('leaves no value empty', () => {
    for (const [name, value] of Object.entries(resolveTheme(studioDark).variables)) {
      expect(value.length, name).toBeGreaterThan(0)
    }
  })

  it('never writes the environment reduced-motion factor', () => {
    // ADR-021: an inline write would outrank the media query and defeat the OS preference.
    expect(resolveTheme(studioDark).variables['--ms-reduced-motion']).toBeUndefined()
  })

  it('multiplies every duration by both motion factors', () => {
    const resolved = resolveTheme(studioDark)

    for (const token of Object.keys(DURATION)) {
      expect(resolved.variables[`--ms-duration-${token}`]).toMatch(
        /^calc\(\d+ms \* var\(--ms-motion-scale\) \* var\(--ms-reduced-motion\)\)$/,
      )
    }
  })
})

describe('the scale controls', () => {
  const withRadius = (scale: ThemeConfig['radiusScale']): ThemeConfig => ({
    ...studioDark,
    id: `radius-${scale}`,
    radiusScale: scale,
  })

  it('scales every radius token at once', () => {
    expect(resolveTheme(withRadius(2)).variables['--ms-radius-lg']).toBe('24px')
    expect(resolveTheme(withRadius(0.5)).variables['--ms-radius-lg']).toBe('6px')
  })

  it('takes every radius to zero at scale 0, including the pill', () => {
    const resolved = resolveTheme(withRadius(0))

    expect(resolved.variables['--ms-radius-lg']).toBe('0px')
    expect(resolved.variables['--ms-radius-full']).toBe('0px')
  })

  it('scales space by the spacing scale', () => {
    const wide: ThemeConfig = { ...studioDark, id: 'wide', spacingScale: 1.125 }

    expect(resolveTheme(wide).variables['--ms-space-4']).toBe('18px')
  })

  it('writes the motion scale the theme asked for', () => {
    const still: ThemeConfig = { ...studioDark, id: 'still', motionScale: 0 }

    expect(resolveTheme(still).variables['--ms-motion-scale']).toBe('0')
  })
})

describe('surface controls', () => {
  it('resolves the glass level to one trio of values', () => {
    const strong: ThemeConfig = {
      ...studioDark,
      id: 'strong-glass',
      surface: { ...studioDark.surface, glassLevel: 'strong' },
    }
    const resolved = resolveTheme(strong)

    expect(resolved.variables['--ms-glass-backdrop-filter']).toContain('blur(32px)')
    expect(resolved.variables['--ms-glass-background']).toMatch(/^oklch\(/)
  })

  it('makes glass none mean absent rather than a level', () => {
    const none: ThemeConfig = {
      ...studioDark,
      id: 'no-glass',
      surface: { ...studioDark.surface, glassLevel: 'none' },
    }
    const resolved = resolveTheme(none)

    expect(resolved.variables['--ms-glass-backdrop-filter']).toBe('none')
    expect(resolved.variables['--ms-glass-background']).toBe('transparent')
  })

  it.each([
    ['hairline', '1px'],
    ['solid', '2px'],
    ['none', '0px'],
  ] as const)('maps border style %s to %s', (borderStyle, width) => {
    const config: ThemeConfig = {
      ...studioDark,
      id: `border-${borderStyle}`,
      surface: { ...studioDark.surface, borderStyle },
    }

    expect(resolveTheme(config).variables['--ms-border-width']).toBe(width)
  })

  it('resolves the noise level to its opacity', () => {
    const noisy: ThemeConfig = {
      ...studioDark,
      id: 'noisy',
      surface: { ...studioDark.surface, noiseLevel: 'medium' },
    }

    expect(resolveTheme(noisy).variables['--ms-noise-opacity']).toBe('0.06')
  })
})

describe('colour mode', () => {
  it('takes the mode from the config when it is explicit', () => {
    expect(resolveTheme(studioLight).mode).toBe('light')
    expect(resolveTheme(studioDark).mode).toBe('dark')
  })

  it('resolves system against the mode the caller measured', () => {
    const system: ThemeConfig = { ...studioDark, id: 'system', colorMode: 'system' }

    expect(resolveTheme(system, { environmentMode: 'dark' }).mode).toBe('dark')
    expect(resolveTheme(system, { environmentMode: 'light' }).mode).toBe('light')
  })

  it('falls back to light when the caller measured nothing', () => {
    const system: ThemeConfig = { ...studioDark, id: 'system-bare', colorMode: 'system' }

    expect(resolveTheme(system).mode).toBe('light')
  })

  it('sends the surface ladder in opposite directions per mode', () => {
    const light = resolveTheme(studioLight).variables
    const dark = resolveTheme(studioDark).variables

    expect(light['--ms-color-surface-1']).toBe('oklch(100% 0 0)')
    expect(dark['--ms-color-surface-1']).not.toBe('oklch(100% 0 0)')
  })
})

describe('memoisation', () => {
  it('returns the same object reference for the same config', () => {
    expect(resolveTheme(studioDark)).toBe(resolveTheme(studioDark))
  })

  it('returns the same reference for an equal config that is not the same object', () => {
    // What a slider drag produces: a fresh object every frame, identical in content.
    const copy: ThemeConfig = { ...studioDark, palette: { ...studioDark.palette } }

    expect(resolveTheme(copy)).toBe(resolveTheme(studioDark))
  })

  it('resolves again when a field the output depends on changes', () => {
    const shifted: ThemeConfig = {
      ...studioDark,
      palette: { ...studioDark.palette, accentHueShift: 12 },
    }

    expect(resolveTheme(shifted)).not.toBe(resolveTheme(studioDark))
  })

  it('resolves again per mode for a system config', () => {
    const system: ThemeConfig = { ...studioDark, id: 'system-modes', colorMode: 'system' }

    expect(resolveTheme(system, { environmentMode: 'dark' })).not.toBe(
      resolveTheme(system, { environmentMode: 'light' }),
    )
  })
})
