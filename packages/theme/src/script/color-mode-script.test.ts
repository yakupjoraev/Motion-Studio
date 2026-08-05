import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  COLOR_MODE_SCRIPT,
  COLOR_MODE_STORAGE_KEY,
  storeColorMode,
  storedColorMode,
} from './color-mode-script'

/** Prompt 06's two constraints on the blocking script, as assertions. */
const BYTE_LIMIT = 300

/** Everything a browser exposes that the script is allowed to touch. */
const ALLOWED_GLOBALS = ['localStorage', 'document']

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-color-mode')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('COLOR_MODE_SCRIPT', () => {
  it('stays under the byte limit, because it blocks paint', () => {
    expect(new TextEncoder().encode(COLOR_MODE_SCRIPT).byteLength).toBeLessThan(BYTE_LIMIT)
  })

  it('references nothing outside document and localStorage', () => {
    // ADR-026: the system preference is resolved in CSS, which is why `matchMedia` is not needed here.
    const identifiers = COLOR_MODE_SCRIPT.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g) ?? []
    const globals = identifiers.filter((name) =>
      ['matchMedia', 'window', 'fetch', 'navigator', 'location'].includes(name),
    )

    expect(globals).toEqual([])
    for (const allowed of ALLOWED_GLOBALS) {
      expect(COLOR_MODE_SCRIPT).toContain(allowed)
    }
  })

  it('applies a stored dark preference', () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'dark')

    // eslint-disable-next-line no-new-func -- exercising the shipped string is the point of the test
    new Function(COLOR_MODE_SCRIPT)()

    expect(document.documentElement.dataset['colorMode']).toBe('dark')
  })

  it('applies a stored light preference', () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'light')

    new Function(COLOR_MODE_SCRIPT)()

    expect(document.documentElement.dataset['colorMode']).toBe('light')
  })

  it('leaves the attribute unset when nothing is stored, so the CSS media query decides', () => {
    new Function(COLOR_MODE_SCRIPT)()

    expect(document.documentElement.hasAttribute('data-color-mode')).toBe(false)
  })

  it('ignores a stored value that is neither mode', () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'sepia')

    new Function(COLOR_MODE_SCRIPT)()

    expect(document.documentElement.hasAttribute('data-color-mode')).toBe(false)
  })

  it('survives a storage context that throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
    })

    expect(() => new Function(COLOR_MODE_SCRIPT)()).not.toThrow()
  })
})

describe('storedColorMode', () => {
  it('reads a stored mode', () => {
    storeColorMode('dark')

    expect(storedColorMode()).toBe('dark')
  })

  it('returns undefined when the user has not chosen', () => {
    expect(storedColorMode()).toBeUndefined()
  })

  it('returns undefined for a value that is not a mode', () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'sepia')

    expect(storedColorMode()).toBeUndefined()
  })

  it('returns undefined rather than throwing when storage is blocked', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
    })

    expect(storedColorMode()).toBeUndefined()
  })
})

describe('storeColorMode', () => {
  it('persists under the same key the script reads', () => {
    storeColorMode('light')

    expect(localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe('light')
  })

  it('does not throw when storage is blocked, because a lost preference is not an error', () => {
    vi.stubGlobal('localStorage', {
      setItem: () => {
        throw new Error('blocked')
      },
    })

    expect(() => storeColorMode('dark')).not.toThrow()
  })
})
