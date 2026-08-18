import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { COLOR_MODE_STORAGE_KEY, storedColorMode } from '../script/color-mode-script'

import { setColorMode } from './set-color-mode'

/** `THEME_ENGINE.md` § Colour mode, as assertions. ADR-200 is why the sequence lives in one function. */
beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-color-mode')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const stubSystem = (dark: boolean): void => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: dark })),
  )
}

describe('setColorMode', () => {
  it.each(['light', 'dark'] as const)('writes the attribute and the preference for %s', (mode) => {
    expect(setColorMode(mode)).toBe(mode)
    expect(document.documentElement.dataset['colorMode']).toBe(mode)
    expect(storedColorMode()).toBe(mode)
  })

  /*
   * The attribute is *removed* rather than set to `system`: the inline script only recognises `light` and
   * `dark`, and the generated stylesheet decides for a root with no attribute at all — ADR-026.
   */
  it('removes both for system', () => {
    setColorMode('dark')
    stubSystem(false)

    expect(setColorMode('system')).toBe('light')
    expect(document.documentElement.hasAttribute('data-color-mode')).toBe(false)
    expect(localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBeNull()
  })

  it('answers system with what the environment says right now', () => {
    stubSystem(true)

    expect(setColorMode('system')).toBe('dark')
  })

  it('writes to the element it is given, so a scoped preview can switch on its own', () => {
    const scope = document.createElement('div')

    setColorMode('dark', { root: scope })

    expect(scope.dataset['colorMode']).toBe('dark')
    expect(document.documentElement.hasAttribute('data-color-mode')).toBe(false)
  })

  it('survives a storage context that throws, because the attribute is the half that paints', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    expect(setColorMode('dark')).toBe('dark')
    expect(document.documentElement.dataset['colorMode']).toBe('dark')
  })
})
