import { PRESETS } from '@motion-studio/theme'
import { describe, expect, it } from 'vitest'

import { createTestStore } from '../../test/create-test-store'

describe('theme setters', () => {
  it('writes a token into the document and makes it an undoable change', () => {
    const store = createTestStore()

    store.getState().setThemeToken('radiusScale', 2)

    const state = store.getState()

    expect(state.document.theme.radiusScale).toBe(2)
    expect(state.version).toBe(1)
    expect(state.dirty).toBe(true)
  })

  it('writes a nested token', () => {
    const store = createTestStore()

    store.getState().setThemeToken('surface.glassLevel', 'strong')

    expect(store.getState().document.theme.surface.glassLevel).toBe('strong')
  })

  it('treats the colour mode as one token among the others', () => {
    const store = createTestStore()

    store.getState().setColorMode('system')

    expect(store.getState().document.theme.colorMode).toBe('system')
  })

  it('applies a preset wholesale, colour mode included', () => {
    const store = createTestStore()

    store.getState().applyThemePreset('studio-light')

    expect(store.getState().document.theme).toEqual(PRESETS['studio-light'])
    expect(store.getState().document.theme.colorMode).toBe('light')
  })

  it('rejects a value the config cannot hold, leaving the theme as it was', () => {
    const store = createTestStore()
    const before = store.getState().document.theme

    expect(() => store.getState().setThemeToken('radiusScale', 7)).toThrow(
      'Not a valid value for theme token radiusScale',
    )
    expect(store.getState().document.theme).toBe(before)
    expect(store.getState().version).toBe(0)
  })

  it('rejects a path the config does not have, so a typo cannot create a dead token', () => {
    const store = createTestStore()

    expect(() => store.getState().setThemeToken('raduisScale', 2)).toThrow(
      'Unknown theme token: raduisScale',
    )
    expect(store.getState().version).toBe(0)
  })

  it('rejects a nested path the config does not have', () => {
    const store = createTestStore()

    expect(() => store.getState().setThemeToken('surface.glasLevel', 'strong')).toThrow(
      'Unknown theme token: surface.glasLevel',
    )
  })

  it('applies a config no preset id names, in one step', () => {
    const store = createTestStore()
    const saved = { ...PRESETS.candy, id: 'custom-1', name: 'Mine' }

    store.getState().setTheme(saved)

    expect(store.getState().document.theme.id).toBe('custom-1')
    expect(store.getState().document.theme.radiusScale).toBe(PRESETS.candy.radiusScale)
    expect(store.getState().version).toBe(1)
  })

  it('fills in a field a stored config predates, rather than rejecting it', () => {
    const store = createTestStore()
    const { repairContrast: _dropped, ...palette } = PRESETS.candy.palette
    const stored = { ...PRESETS.candy, id: 'custom-2', palette } as typeof PRESETS.candy

    store.getState().setTheme(stored)

    expect(store.getState().document.theme.palette.repairContrast).toBe(true)
  })

  it('rejects a stored config that is not a theme at all', () => {
    const store = createTestStore()
    const broken = { ...PRESETS.candy, radiusScale: 7 } as unknown as typeof PRESETS.candy

    expect(() => store.getState().setTheme(broken)).toThrow('Not a valid theme')
    expect(store.getState().version).toBe(0)
  })

  it('does nothing when the token already holds that value', () => {
    const store = createTestStore()
    const value = store.getState().document.theme.radiusScale

    store.getState().setThemeToken('radiusScale', value)

    expect(store.getState().version).toBe(0)
  })
})
