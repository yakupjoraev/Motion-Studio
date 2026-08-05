import { describe, expect, it } from 'vitest'

import { studioDark } from './presets/index'
import { fontPairingSchema, neutralHueSchema, themeConfigSchema } from './theme.schema'

import type { ThemeConfig } from './theme.types'

/**
 * The schema and the types are declared separately so each reads on its own. This is what stops them
 * drifting: a `ThemeConfig` must parse, and a parsed value must be assignable to `ThemeConfig`.
 */
describe('themeConfigSchema', () => {
  it('accepts a ThemeConfig', () => {
    const parsed = themeConfigSchema.parse(studioDark)
    const asConfig: ThemeConfig = parsed

    expect(asConfig.id).toBe('studio-dark')
  })

  it('rejects a hue shift outside the documented range', () => {
    const config = { ...studioDark, palette: { ...studioDark.palette, accentHueShift: 45 } }

    expect(themeConfigSchema.safeParse(config).success).toBe(false)
  })

  it('rejects a saturation outside 0.5..1.5', () => {
    expect(
      themeConfigSchema.safeParse({
        ...studioDark,
        palette: { ...studioDark.palette, saturation: 2 },
      }).success,
    ).toBe(false)
  })

  it('rejects a radius scale that is not one of the five steps', () => {
    expect(themeConfigSchema.safeParse({ ...studioDark, radiusScale: 1.25 }).success).toBe(false)
  })

  it('rejects a base size the type does not allow', () => {
    expect(
      themeConfigSchema.safeParse({
        ...studioDark,
        typography: { ...studioDark.typography, baseSize: 18 },
      }).success,
    ).toBe(false)
  })

  it('rejects an empty id, because a preset is addressed by it', () => {
    expect(themeConfigSchema.safeParse({ ...studioDark, id: '' }).success).toBe(false)
  })

  it('rejects an unknown elevation style', () => {
    expect(themeConfigSchema.safeParse({ ...studioDark, elevationStyle: 'neon' }).success).toBe(
      false,
    )
  })

  it('accepts system as a colour mode preference', () => {
    expect(themeConfigSchema.safeParse({ ...studioDark, colorMode: 'system' }).success).toBe(true)
  })
})

describe('the enums match their types', () => {
  it('lists the six neutral families', () => {
    expect(neutralHueSchema.options).toEqual(['slate', 'zinc', 'stone', 'gray', 'warm', 'cool'])
  })

  it('lists the five font pairings', () => {
    expect(fontPairingSchema.options).toEqual([
      'geist',
      'inter-mono',
      'satoshi-jet',
      'sohne-berkeley',
      'system',
    ])
  })
})
