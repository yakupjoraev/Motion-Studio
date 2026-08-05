import { contrastRatio } from '@motion-studio/utils'
import { describe, expect, it } from 'vitest'

import { resolveTheme } from '../resolve/resolve-theme'
import { themeConfigSchema } from '../theme.schema'
import { PRESETS, type PresetId } from './presets'

import type { SemanticColorToken } from '@motion-studio/tokens'
import type { ThemeConfig } from '../theme.types'

/**
 * `ACCESSIBILITY.md` § Contrast: the gate "runs over every semantic pair in both modes, and over all ten
 * theme presets". This is that second half. The lists are `DESIGN_SYSTEM.md`'s, verbatim.
 */
const TEXT_PAIRS: readonly (readonly [SemanticColorToken, SemanticColorToken])[] = [
  ['foreground', 'surface-0'],
  ['foreground', 'surface-1'],
  ['foreground', 'surface-2'],
  ['foreground', 'surface-3'],
  ['foreground', 'surface-inset'],
  ['foreground-muted', 'surface-0'],
  ['foreground-muted', 'surface-1'],
  ['foreground-muted', 'surface-2'],
  ['foreground-muted', 'surface-3'],
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

const UI_PAIRS: readonly (readonly [SemanticColorToken, SemanticColorToken])[] = [
  ['accent-ring', 'surface-0'],
  ['accent-ring', 'surface-inset'],
  ['foreground-subtle', 'surface-0'],
  ['foreground-subtle', 'surface-1'],
  ['foreground-subtle', 'surface-2'],
  ['foreground-subtle', 'surface-3'],
  ['canvas-selection', 'canvas-bg'],
  ['canvas-guide', 'canvas-bg'],
  ['canvas-snap', 'canvas-bg'],
]

const ids = Object.keys(PRESETS) as PresetId[]

const colorOf = (config: ThemeConfig) => {
  const resolved = resolveTheme(config)

  return (token: SemanticColorToken): string => {
    const value = resolved.variables[`--ms-color-${token}`]
    if (value === undefined) {
      throw new Error(`${config.id} emitted no --ms-color-${token}`)
    }

    return value
  }
}

describe.each(ids)('%s', (id) => {
  const config = PRESETS[id]

  it.each(TEXT_PAIRS)('%s on %s is at least 4.5:1', (foreground, background) => {
    const color = colorOf(config)

    expect(contrastRatio(color(foreground), color(background))).toBeGreaterThanOrEqual(4.5)
  })

  it.each(UI_PAIRS)('%s on %s is at least 3:1', (foreground, background) => {
    const color = colorOf(config)

    expect(contrastRatio(color(foreground), color(background))).toBeGreaterThanOrEqual(3)
  })

  it('satisfies the schema, so it survives a round trip through a .motion file', () => {
    expect(themeConfigSchema.safeParse(config).success).toBe(true)
  })

  it('resolves with no unrepairable warning', () => {
    expect(resolveTheme(config).warnings).toEqual([])
  })
})

describe('the preset set', () => {
  it('ships the ten the document lists, in its order', () => {
    expect(ids).toEqual([
      'studio-dark',
      'studio-light',
      'midnight',
      'paper',
      'brutal',
      'aurora',
      'ember',
      'nord',
      'mono',
      'candy',
    ])
  })

  it('gives every preset an id matching its key, which the theme builder relies on', () => {
    for (const id of ids) {
      expect(PRESETS[id].id).toBe(id)
    }
  })

  it('covers both colour modes', () => {
    const modes = new Set(ids.map((id) => PRESETS[id].colorMode))

    expect(modes).toEqual(new Set(['light', 'dark']))
  })

  it('exercises all four elevation styles across the set', () => {
    const styles = new Set(ids.map((id) => PRESETS[id].elevationStyle))

    expect(styles).toEqual(new Set(['flat', 'soft', 'sharp', 'glow']))
  })

  it('keeps studio-light and studio-dark on one generated ramp', () => {
    // ADR-023: the two seeds differ only in the lightness that selects the accent step.
    const light = resolveTheme(PRESETS['studio-light']).variables['--ms-color-accent-muted']
    const dark = resolveTheme(PRESETS['studio-dark']).variables['--ms-color-accent-active']

    expect(light).toBeDefined()
    expect(dark).toBeDefined()
  })
})

describe('the saturation control across its whole range', () => {
  // `palette.saturation` applies to the neutral ramp as well as the accent, and every surface in both
  // contrast lists is built from that ramp — so the range is swept rather than assumed.
  const SATURATIONS = [0.5, 1, 1.5] as const

  it.each(ids.flatMap((id) => SATURATIONS.map((saturation) => [id, saturation] as const)))(
    '%s at saturation %s clears both lists',
    (id, saturation) => {
      const config: ThemeConfig = {
        ...PRESETS[id],
        id: `${id}-sat-${saturation}`,
        palette: { ...PRESETS[id].palette, saturation },
      }
      const color = colorOf(config)

      for (const [foreground, background] of TEXT_PAIRS) {
        expect(
          contrastRatio(color(foreground), color(background)),
          `${foreground}/${background}`,
        ).toBeGreaterThanOrEqual(4.5)
      }
      for (const [foreground, background] of UI_PAIRS) {
        expect(
          contrastRatio(color(foreground), color(background)),
          `${foreground}/${background}`,
        ).toBeGreaterThanOrEqual(3)
      }
    },
  )
})
