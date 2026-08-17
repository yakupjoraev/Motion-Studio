import { formatHex, parseOklch } from '@motion-studio/utils'
import { describe, expect, it } from 'vitest'

import { PRESETS, studioDark } from '../presets/index'

import {
  TOKEN_FORMATS,
  exportedAccent,
  overrideNotes,
  resolveForExport,
  toCssVariables,
  toFigmaTokens,
  toTailwindConfig,
  toTokensJson,
} from './index'

import type { ThemeConfig } from '../theme.types'

const exported = resolveForExport(studioDark)

/** An accent no step of the ramp can carry in light mode: pale, and barely chromatic. */
const failing: ThemeConfig = {
  ...studioDark,
  colorMode: 'light',
  palette: { ...studioDark.palette, accent: 'oklch(92% 0.03 95)', repairContrast: false },
}

describe('resolveForExport', () => {
  it('resolves both modes whatever the config asks for', () => {
    expect(exported.light.mode).toBe('light')
    expect(exported.dark.mode).toBe('dark')
  })

  it('emits the config verbatim, so a re-import reproduces the theme', () => {
    expect(exported.config).toBe(studioDark)
  })
})

describe('the four formats', () => {
  it('all carry the same accent, because they come from one resolution', () => {
    const accent = exportedAccent(exported)

    expect(accent).not.toBe('')
    // Two formats carry the value, and two carry it in the only form their destination accepts: a
    // variable reference for Tailwind, sRGB hex for Figma. Same accent, four spellings.
    expect(toCssVariables(exported)).toContain(`--ms-color-accent: ${accent}`)
    expect(toTokensJson(exported)).toContain(accent)
    expect(toTailwindConfig(exported)).toContain("'accent': 'var(--ms-color-accent)'")
    expect(toFigmaTokens(exported)).toContain(formatHex(parseOklch(accent)))
  })

  it('names one file each', () => {
    const names = TOKEN_FORMATS.map((format) => format.filename)

    expect(new Set(names).size).toBe(names.length)
  })

  it('prints something for every shipped preset, in both modes', () => {
    for (const preset of Object.values(PRESETS)) {
      const theme = resolveForExport(preset)

      for (const format of TOKEN_FORMATS) {
        expect(format.print(theme).length).toBeGreaterThan(100)
      }
    }
  })
})

describe('toCssVariables', () => {
  it('emits a root block for light and an attribute block for dark', () => {
    const css = toCssVariables(exported)

    expect(css).toContain(':root {')
    expect(css).toContain(":root[data-color-mode='dark'] {")
    expect(css).toContain('@media (prefers-color-scheme: dark)')
  })

  it('carries the light and the dark surface, which differ', () => {
    const css = toCssVariables(exported)

    expect(css).toContain(exported.light.variables['--ms-color-surface-1'] ?? 'missing')
    expect(css).toContain(exported.dark.variables['--ms-color-surface-1'] ?? 'missing')
  })
})

describe('toTailwindConfig', () => {
  it('points utilities at the variables rather than at values', () => {
    const config = toTailwindConfig(exported)

    expect(config).toContain("'accent': 'var(--ms-color-accent)'")
    expect(config).toContain("'lg': 'var(--ms-radius-lg)'")
    expect(config).toContain("'sans': 'var(--ms-font-sans)'")
  })

  it('keeps line-height and tracking out of fontSize', () => {
    expect(toTailwindConfig(exported)).not.toContain('--ms-text-lg-line-height')
  })
})

describe('toTokensJson', () => {
  it('parses, and carries the config plus both resolutions', () => {
    const parsed: unknown = JSON.parse(toTokensJson(exported))
    const document = parsed as {
      config: ThemeConfig
      resolved: { light: { variables: Record<string, string> }; dark: unknown }
    }

    expect(document.config.id).toBe('studio-dark')
    expect(document.resolved.light.variables['--ms-color-accent']).toBe(exportedAccent(exported))
    expect(document.resolved.dark).toBeDefined()
  })
})

describe('toFigmaTokens', () => {
  it('parses, and states a type and a hex value per colour', () => {
    const parsed: unknown = JSON.parse(toFigmaTokens(exported))
    const document = parsed as {
      color: { light: Record<string, { $type: string; $value: string }> }
      radius: Record<string, { $value: string }>
    }
    const accent = document.color.light['accent']

    expect(accent?.$type).toBe('color')
    expect(accent?.$value).toMatch(/^#[0-9a-f]{6,8}$/)
    expect(document.radius['lg']?.$value).toBe(exported.light.variables['--ms-radius-lg'])
  })

  it('leaves out the groups whose values are CSS strings', () => {
    const document = JSON.parse(toFigmaTokens(exported)) as Record<string, unknown>

    expect(document['shadow']).toBeUndefined()
    expect(document['duration']).toBeUndefined()
  })
})

describe('a declined repair', () => {
  const declined = resolveForExport(failing)

  it('is reported by the engine as an override', () => {
    expect(declined.light.overrides.length + declined.light.warnings.length).toBeGreaterThan(0)
  })

  it('reaches every format that can carry a note', () => {
    const notes = overrideNotes(declined)

    if (notes.length === 0) {
      // The accent failed beyond repair, so it is a warning rather than an override; the warning is
      // what the formats then carry, and both paths are asserted rather than assumed.
      expect(toCssVariables(declined)).toContain('light mode:')
      expect(toTokensJson(declined)).toContain('contrastWarnings')

      return
    }

    const first = notes[0] ?? ''

    expect(toCssVariables(declined)).toContain(first)
    expect(toTailwindConfig(declined)).toContain(first)
    expect(toTokensJson(declined)).toContain('contrastOverrides')
    expect(toFigmaTokens(declined)).toContain(first)
  })
})
